<?php

namespace App\Controller\Api;

use App\Entity\BonLivraison;
use App\Entity\Colis;
use App\Entity\User;
use App\Repository\BonLivraisonRepository;
use App\Repository\ColisRepository;
use App\Service\BonLivraisonPdfGenerator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('IS_AUTHENTICATED_FULLY')]
#[Route('/api/bon-livraison')]
final class BonLivraisonApiController extends AbstractController
{
    #[Route('/{id}/download', name: 'api_bon_livraison_download', methods: ['GET'])]
    public function download(Request $request, BonLivraison $bon, BonLivraisonPdfGenerator $pdfGenerator): Response
    {
        $lang = (string) $request->query->get('lang', 'fr');
        if (trim((string) $bon->getReference()) === '') {
            return $this->json(['message' => 'Document non disponible'], Response::HTTP_NOT_FOUND);
        }

        try {
            return $pdfGenerator->generateDownloadResponse($bon, $lang);
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Erreur lors de la génération du document PDF.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    #[Route('', name: 'api_bon_livraison_index', methods: ['GET'])]
    public function index(Request $request, BonLivraisonRepository $bonLivraisonRepository): JsonResponse
    {
        $search = trim((string) $request->query->get('q', ''));
        $selectedStatut = trim((string) $request->query->get('statut', ''));

        $user = $this->getUser();
        $scopedUser = null;
        if (!$this->isGranted('ROLE_SUPERVISEUR') && !$this->isGranted('ROLE_LIVREUR') && $user instanceof User) {
            $scopedUser = $user;
        }

        $bons = $bonLivraisonRepository->findAllForList($search, $selectedStatut, $scopedUser);

        $data = array_map(function (BonLivraison $bon) {
            $statusLabel = BonLivraison::getStatusLabels()[$bon->getStatus()] ?? $bon->getStatus();
            $colisData = array_map(static function (Colis $colis) {
                return [
                    'id' => $colis->getId(),
                    'trackingCode' => $colis->getTrackingCode(),
                    'productNature' => $colis->getProductNature(),
                    'recipient' => $colis->getRecipient(),
                    'city' => $colis->getCity(),
                    'createdAt' => $colis->getCreatedAt() ? $colis->getCreatedAt()->format('d/m/Y H:i') : '-',
                    'statut' => $colis->getStatut() ?: 'En attente',
                ];
            }, $bon->getColis()->toArray());

            return [
                'id' => $bon->getId(),
                'reference' => $bon->getReference(),
                'status' => $bon->getStatus(),
                'statusLabel' => $statusLabel,
                'statusBadgeClass' => match ($bon->getStatus()) {
                    'enregistre' => 'kt-badge-success',
                    'annule' => 'kt-badge-destructive',
                    default => 'kt-badge-warning',
                },
                'createdAt' => $bon->getCreatedAt() ? $bon->getCreatedAt()->format('d/m/Y H:i') : '-',
                'registeredAt' => $bon->getRegisteredAt() ? $bon->getRegisteredAt()->format('d/m/Y H:i') : '-',
                'colis' => $colisData,
            ];
        }, $bons);

        return $this->json([
            'bons' => $data,
            'statuts_possibles' => BonLivraison::getStatusesPossibles(),
            'statut_labels' => BonLivraison::getStatusLabels(),
        ]);
    }

    #[Route('/available-colis', name: 'api_bon_livraison_available_colis', methods: ['GET'])]
    public function availableColis(
        Request $request,
        ColisRepository $colisRepository,
        BonLivraisonRepository $bonLivraisonRepository
    ): JsonResponse {
        $search = trim((string) $request->query->get('q', ''));
        $bonId = $request->query->get('bon_id');
        $currentBon = $bonId ? $bonLivraisonRepository->find((int) $bonId) : null;

        $allColis = $colisRepository->findBy([], ['id' => 'DESC']);
        
        $assignedIds = $bonLivraisonRepository->findColisIdsAlreadyAssigned(
            array_map(static fn(Colis $c): int => (int) $c->getId(), $allColis),
            $currentBon?->getId()
        );
        $assignedMap = array_fill_keys($assignedIds, true);

        $currentSelectedIds = [];
        if ($currentBon !== null) {
            foreach ($currentBon->getColis() as $colis) {
                $currentSelectedIds[(int) $colis->getId()] = true;
            }
        }

        $filtered = [];
        foreach ($allColis as $colis) {
            $id = (int) $colis->getId();
            if (isset($assignedMap[$id]) && !isset($currentSelectedIds[$id])) {
                continue;
            }

            if ($search !== '') {
                $haystack = mb_strtolower(implode(' ', [
                    (string) $colis->getTrackingCode(),
                    (string) $colis->getOrderNumber(),
                    (string) $colis->getProductNature(),
                    (string) $colis->getCity(),
                    (string) $colis->getRecipient(),
                ]));
                if (!str_contains($haystack, mb_strtolower($search))) {
                    continue;
                }
            }

            $filtered[] = [
                'id' => $colis->getId(),
                'trackingCode' => $colis->getTrackingCode(),
                'productNature' => $colis->getProductNature() ?: 'Marchandise',
                'recipient' => $colis->getRecipient() ?: '-',
                'city' => $colis->getCity(),
                'createdAt' => $colis->getCreatedAt() ? $colis->getCreatedAt()->format('d/m/Y H:i') : '-',
                'statut' => $colis->getStatut() ?: 'En attente',
                'isSelected' => isset($currentSelectedIds[$id]),
            ];
        }

        return $this->json([
            'availableColis' => $filtered,
            'selectedColisIds' => array_keys($currentSelectedIds),
        ]);
    }

    #[Route('/new', name: 'api_bon_livraison_new', methods: ['POST'])]
    public function new(
        Request $request,
        EntityManagerInterface $entityManager,
        ColisRepository $colisRepository,
        BonLivraisonRepository $bonLivraisonRepository
    ): JsonResponse {
        $payload = json_decode($request->getContent(), true) ?: $request->request->all();
        $colisIds = array_values(array_filter(
            array_map('intval', $payload['colis_ids'] ?? $payload['colisIds'] ?? []),
            static fn(int $id): bool => $id > 0
        ));

        if ($colisIds === []) {
            return $this->json(['message' => 'Veuillez sélectionner au moins un colis.'], Response::HTTP_BAD_REQUEST);
        }

        $alreadyAssigned = $bonLivraisonRepository->findColisIdsAlreadyAssigned($colisIds, null);
        if ($alreadyAssigned !== []) {
            return $this->json(['message' => 'Un ou plusieurs colis sont déjà associés à un autre bon de livraison.'], Response::HTTP_BAD_REQUEST);
        }

        $colisList = $colisRepository->findBy(['id' => $colisIds]);
        if (\count($colisList) !== \count($colisIds)) {
            return $this->json(['message' => 'Un ou plusieurs colis sélectionnés sont introuvables.'], Response::HTTP_BAD_REQUEST);
        }

        $bon = new BonLivraison();
        $bon->generateReference();

        $user = $this->getUser();
        if ($user instanceof User) {
            $bon->setCreatedBy($user);
        }

        foreach ($colisList as $colis) {
            $bon->addColis($colis);
        }

        $bon->setStatus(BonLivraison::STATUS_ENREGISTRE);
        $bon->setRegisteredAt(new \DateTimeImmutable());

        $entityManager->persist($bon);
        $entityManager->flush();

        return $this->json([
            'message' => 'Bon de livraison créé avec succès.',
            'id' => $bon->getId(),
            'reference' => $bon->getReference(),
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_bon_livraison_show', methods: ['GET'])]
    public function show(BonLivraison $bon): JsonResponse
    {
        $selectedColisIds = array_map(static fn(Colis $c): int => (int) $c->getId(), $bon->getColis()->toArray());

        return $this->json([
            'id' => $bon->getId(),
            'reference' => $bon->getReference(),
            'status' => $bon->getStatus(),
            'createdAt' => $bon->getCreatedAt() ? $bon->getCreatedAt()->format('d/m/Y H:i') : '-',
            'registeredAt' => $bon->getRegisteredAt() ? $bon->getRegisteredAt()->format('d/m/Y H:i') : '-',
            'selectedColisIds' => $selectedColisIds,
        ]);
    }

    #[Route('/{id}/edit', name: 'api_bon_livraison_edit', methods: ['PUT', 'POST'])]
    public function edit(
        Request $request,
        BonLivraison $bon,
        EntityManagerInterface $entityManager,
        ColisRepository $colisRepository,
        BonLivraisonRepository $bonLivraisonRepository
    ): JsonResponse {
        $payload = json_decode($request->getContent(), true) ?: $request->request->all();
        $colisIds = array_values(array_filter(
            array_map('intval', $payload['colis_ids'] ?? $payload['colisIds'] ?? []),
            static fn(int $id): bool => $id > 0
        ));

        if ($colisIds === []) {
            return $this->json(['message' => 'Veuillez sélectionner au moins un colis.'], Response::HTTP_BAD_REQUEST);
        }

        $alreadyAssigned = $bonLivraisonRepository->findColisIdsAlreadyAssigned($colisIds, $bon->getId());
        if ($alreadyAssigned !== []) {
            return $this->json(['message' => 'Un ou plusieurs colis sont déjà associés à un autre bon de livraison.'], Response::HTTP_BAD_REQUEST);
        }

        $colisList = $colisRepository->findBy(['id' => $colisIds]);
        if (\count($colisList) !== \count($colisIds)) {
            return $this->json(['message' => 'Un ou plusieurs colis sélectionnés sont introuvables.'], Response::HTTP_BAD_REQUEST);
        }

        $bon->clearColis();
        foreach ($colisList as $colis) {
            $bon->addColis($colis);
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Bon de livraison mis à jour avec succès.',
            'id' => $bon->getId(),
            'reference' => $bon->getReference(),
        ]);
    }

    #[Route('/{id}', name: 'api_bon_livraison_delete', methods: ['DELETE', 'POST'])]
    public function delete(BonLivraison $bon, EntityManagerInterface $entityManager): JsonResponse
    {
        $bon->clearColis();
        $entityManager->remove($bon);
        $entityManager->flush();

        return $this->json(['message' => 'Bon de livraison supprimé avec succès.']);
    }
}
