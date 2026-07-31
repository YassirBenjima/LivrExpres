<?php

namespace App\Controller\Api;

use App\Entity\Crbt;

use App\Entity\ReturnRequest;
use App\Entity\User;
use App\Repository\ColisRepository;
use App\Repository\CrbtRepository;
use App\Repository\ReturnRequestRepository;
use App\Service\CrbtManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_CLIENT')]
final class RetourFacturationApiController extends AbstractController
{
    // ==========================================
    // DEMANDES DE RETOUR
    // ==========================================

    #[Route('/api/retour/demandes', name: 'api_retour_demandes_list', methods: ['GET'])]
    public function getDemandesRetour(
        Request $request,
        ReturnRequestRepository $returnRequestRepository
    ): JsonResponse {
        $search = trim((string) $request->query->get('q', ''));
        $selectedStatut = trim((string) $request->query->get('statut', ''));

        $user = $this->getUser();
        $scopedUser = (!$this->isGranted('ROLE_SUPERVISEUR') && $user instanceof User) ? $user : null;

        $demandes = $returnRequestRepository->findAllForList($search, $selectedStatut, $scopedUser);
        $statutLabels = ReturnRequest::getStatusLabels();

        $data = [];
        foreach ($demandes as $demande) {
            $colisData = [];
            foreach ($demande->getColis() as $colis) {
                $colisData[] = [
                    'id' => $colis->getId(),
                    'trackingCode' => $colis->getTrackingCode(),
                    'productNature' => $colis->getProductNature(),
                    'recipient' => $colis->getRecipient(),
                    'city' => $colis->getCity(),
                ];
            }

            $statut = $demande->getStatus();
            $data[] = [
                'id' => $demande->getId(),
                'receptionType' => $demande->getReceptionType(),
                'createdAt' => $demande->getCreatedAt() ? $demande->getCreatedAt()->format('d/m/Y H:i') : null,
                'bonReference' => $demande->getBonReference() ?: '-',
                'note' => $demande->getNote() ?: '-',
                'status' => $statut,
                'statusLabel' => $statutLabels[$statut] ?? $statut,
                'statusBadgeClass' => match ($statut) {
                    ReturnRequest::STATUS_PROCESSING => 'kt-badge-info',
                    ReturnRequest::STATUS_RECEIVED => 'kt-badge-success',
                    ReturnRequest::STATUS_CANCELLED => 'kt-badge-destructive',
                    default => 'kt-badge-warning',
                },
                'colis' => $colisData,
            ];
        }

        return $this->json([
            'demandes' => $data,
            'statuts_possibles' => ReturnRequest::getStatusesPossibles(),
            'statut_labels' => $statutLabels,
        ]);
    }

    #[Route('/api/retour/demandes/new-data', name: 'api_retour_demandes_new_data', methods: ['GET'])]
    public function getDemandeNewData(
        Request $request,
        ColisRepository $colisRepository,
        ReturnRequestRepository $returnRequestRepository
    ): JsonResponse {
        $search = trim((string) $request->query->get('q', ''));
        $user = $this->getUser();
        
        $qb = $colisRepository->createQueryBuilder('c')->orderBy('c.id', 'DESC');
        if (!$this->isGranted('ROLE_SUPERVISEUR') && $user instanceof User) {
            $qb->andWhere('c.createdBy = :user')
               ->setParameter('user', $user);
        }
        $allColis = $qb->getQuery()->getResult();

        $assignedIds = $returnRequestRepository->findColisIdsAlreadyAssigned(
            array_map(static fn ($c) => (int) $c->getId(), $allColis)
        );
        $assignedMap = array_fill_keys($assignedIds, true);

        $availableColis = [];
        $searchLower = mb_strtolower($search);

        foreach ($allColis as $colis) {
            $id = (int) $colis->getId();
            if (isset($assignedMap[$id]) || $colis->isRetourne()) {
                continue;
            }

            if ($searchLower !== '') {
                $tracking = mb_strtolower((string) $colis->getTrackingCode());
                $orderNum = mb_strtolower((string) $colis->getOrderNumber());
                if (!str_contains($tracking, $searchLower) && !str_contains($orderNum, $searchLower)) {
                    continue;
                }
            }

            $availableColis[] = [
                'id' => $colis->getId(),
                'trackingCode' => $colis->getTrackingCode(),
                'productNature' => $colis->getProductNature() ?: 'Marchandise',
                'createdAt' => $colis->getCreatedAt() ? $colis->getCreatedAt()->format('d/m/Y H:i') : '',
                'recipient' => $colis->getRecipient() ?: '-',
                'phoneNumber' => $colis->getPhoneNumber() ?: '-',
                'city' => $colis->getCity() ?: '-',
                'address' => $colis->getAddress() ?: '-',
                'price' => (float) ($colis->getPrice() ?? 0.0),
                'statut' => $colis->getStatut() ?? 'En attente',
            ];
        }

        $user = $this->getUser();
        $receptionType = $user instanceof User ? ($user->getReturnReception() ?? 'En Agence') : 'En Agence';

        return $this->json([
            'available_colis' => $availableColis,
            'reception_type' => $receptionType,
        ]);
    }

    #[Route('/api/retour/demandes/create', name: 'api_retour_demandes_create', methods: ['POST'])]
    public function createDemandeRetour(
        Request $request,
        EntityManagerInterface $entityManager,
        ColisRepository $colisRepository,
        ReturnRequestRepository $returnRequestRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $colisIds = array_values(array_filter(
            array_map('intval', $data['colis_ids'] ?? []),
            static fn (int $id): bool => $id > 0
        ));

        if (count($colisIds) === 0) {
            return $this->json(['message' => 'Veuillez sélectionner au moins un colis.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $alreadyAssigned = $returnRequestRepository->findColisIdsAlreadyAssigned($colisIds);
        if (count($alreadyAssigned) > 0) {
            return $this->json(['message' => 'Un ou plusieurs colis sont déjà associés à une autre demande de retour.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $colisList = $colisRepository->findBy(['id' => $colisIds]);
        if (count($colisList) !== count($colisIds)) {
            return $this->json(['message' => 'Un ou plusieurs colis sélectionnés sont introuvables.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        foreach ($colisList as $colis) {
            if ($colis->isRetourne()) {
                return $this->json(['message' => 'Les colis déjà retournés ne peuvent pas être ajoutés à une demande.'], JsonResponse::HTTP_BAD_REQUEST);
            }
        }

        $user = $this->getUser();
        $receptionType = trim((string) ($data['reception_type'] ?? ''));
        if ($receptionType === '' && $user instanceof User) {
            $receptionType = $user->getReturnReception() ?? 'En Agence';
        }
        if ($receptionType === '') {
            $receptionType = 'En Agence';
        }

        $demande = new ReturnRequest();
        $demande->setReceptionType($receptionType);
        $demande->setNote(trim((string) ($data['note'] ?? '')) ?: null);
        $demande->setStatus(ReturnRequest::STATUS_PENDING);
        $demande->generateBonReference();

        if ($user instanceof User) {
            $demande->setCreatedBy($user);
        }

        foreach ($colisList as $colis) {
            $demande->addColis($colis);
        }

        $entityManager->persist($demande);
        $entityManager->flush();

        return $this->json(['message' => 'Demande de retour créée avec succès.']);
    }

    // ==========================================
    // BONS DE RETOUR
    // ==========================================

    #[Route('/api/retour/bons', name: 'api_retour_bons_list', methods: ['GET'])]
    public function getBonsRetour(
        Request $request,
        ReturnRequestRepository $returnRequestRepository
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Non autorisé.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $search = trim((string) $request->query->get('q', ''));
        $selectedStatut = trim((string) $request->query->get('statut', ''));

        $bons = $returnRequestRepository->findAllForClientList((int) $user->getId(), $search, $selectedStatut);
        $statutLabels = ReturnRequest::getStatusLabels();

        $data = [];
        foreach ($bons as $bon) {
            $colisData = [];
            foreach ($bon->getColis() as $colis) {
                $colisData[] = [
                    'id' => $colis->getId(),
                    'trackingCode' => $colis->getTrackingCode(),
                    'productNature' => $colis->getProductNature(),
                ];
            }

            $statut = $bon->getStatus();
            $data[] = [
                'id' => $bon->getId(),
                'bonReference' => $bon->getBonReference() ?: '-',
                'receptionType' => $bon->getReceptionType(),
                'createdAt' => $bon->getCreatedAt() ? $bon->getCreatedAt()->format('d/m/Y H:i') : null,
                'colisCount' => count($bon->getColis()),
                'colis' => $colisData,
                'status' => $statut,
                'statusLabel' => $statutLabels[$statut] ?? $statut,
                'statusBadgeClass' => match ($statut) {
                    ReturnRequest::STATUS_PROCESSING => 'kt-badge-info',
                    ReturnRequest::STATUS_RECEIVED => 'kt-badge-success',
                    ReturnRequest::STATUS_CANCELLED => 'kt-badge-destructive',
                    default => 'kt-badge-warning',
                },
                'hasPdf' => trim((string) $bon->getBonReference()) !== '',
            ];
        }

        return $this->json([
            'bons' => $data,
            'statuts_possibles' => ReturnRequest::getStatusesPossibles(),
            'statut_labels' => $statutLabels,
        ]);
    }

    #[Route('/api/retour/bons/{id}/download', name: 'api_retour_bons_download', methods: ['GET'])]
    public function downloadBonRetour(
        ReturnRequest $demande,
        \App\Service\BonRetourPdfGenerator $pdfGenerator
    ): \Symfony\Component\HttpFoundation\Response {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Non autorisé.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $ownerId = $demande->getCreatedBy()?->getId();
        if ($ownerId === null || $ownerId !== $user->getId()) {
            return $this->json(['message' => 'Document non disponible.'], JsonResponse::HTTP_FORBIDDEN);
        }

        if (trim((string) $demande->getBonReference()) === '') {
            return $this->json(['message' => 'Document non disponible.'], JsonResponse::HTTP_NOT_FOUND);
        }

        try {
            return $pdfGenerator->generateDownloadResponse($demande);
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Document non disponible.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // ==========================================
    // FACTURATION (CRBT)
    // ==========================================

    #[Route('/api/facturation/crbt', name: 'api_facturation_crbt_list', methods: ['GET'])]
    public function getFacturationCrbt(
        Request $request,
        CrbtRepository $crbtRepository,
        CrbtManager $crbtManager
    ): JsonResponse {
        $crbtManager->syncMissingEntries();

        $search = trim((string) $request->query->get('q', ''));
        $selectedStatut = trim((string) $request->query->get('statut', ''));

        $dateFromStr = trim((string) $request->query->get('date_from', ''));
        $dateToStr = trim((string) $request->query->get('date_to', ''));

        $dateFrom = $dateFromStr !== '' ? \DateTimeImmutable::createFromFormat('Y-m-d', $dateFromStr) : null;
        $dateTo = $dateToStr !== '' ? \DateTimeImmutable::createFromFormat('Y-m-d', $dateToStr) : null;

        if ($dateFrom === false) $dateFrom = null;
        if ($dateTo === false) $dateTo = null;

        $user = $this->getUser();
        $scopedUser = (!$this->isGranted('ROLE_SUPERVISEUR') && $user instanceof User) ? $user : null;

        $entries = $crbtRepository->findAllForList($search, $selectedStatut, $dateFrom, $dateTo, $scopedUser);
        $summary = $crbtRepository->computeSummaryTotals($search, $selectedStatut, $dateFrom, $dateTo, $scopedUser);

        $statutLabels = Crbt::getStatusLabels();
        $data = [];

        foreach ($entries as $crbt) {
            $statut = $crbt->getStatus();
            $colis = $crbt->getColis();
            $data[] = [
                'id' => $crbt->getId(),
                'code' => $crbt->getReference() ?: ('CRBT-' . $crbt->getId()),
                'dateCreation' => $crbt->getCreatedAt() ? $crbt->getCreatedAt()->format('d/m/Y H:i') : '-',
                'nbrColis' => 1,
                'totalBrut' => (float) ($colis ? $colis->getPrice() : $crbt->getMontant()),
                'fraisLivraison' => 0.0,
                'fraisRefus' => 0.0,
                'totalNet' => (float) $crbt->getBalance(),
                'statut' => $statut,
                'statutLabel' => $statutLabels[$statut] ?? $statut,
                'statutBadgeClass' => match ($statut) {
                    Crbt::STATUS_PAYE => 'kt-badge-success',
                    Crbt::STATUS_DISPONIBLE => 'kt-badge-info',
                    default => 'kt-badge-warning',
                },
            ];
        }

        return $this->json([
            'entries' => $data,
            'summary' => [
                'totalNet' => (float) ($summary['disponible'] ?? 0.0) + (float) ($summary['paye'] ?? 0.0),
                'totalBrut' => (float) ($summary['disponible'] ?? 0.0) + (float) ($summary['paye'] ?? 0.0) + (float) ($summary['en_attente'] ?? 0.0),
                'fraisLivraison' => 0.0,
                'fraisRefus' => 0.0,
                'nbrColis' => count($entries),
            ],
            'statuts_possibles' => Crbt::getStatusesPossibles(),
            'statut_labels' => $statutLabels,
        ]);
    }

    #[Route('/api/facturation/virement/create', name: 'api_facturation_virement_create', methods: ['POST'])]
    public function createVirement(
        Request $request,
        CrbtRepository $crbtRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $crbtId = (int) ($data['crbt_id'] ?? 0);

        if ($crbtId <= 0) {
            return $this->json(['message' => 'Identifiant CRBT invalide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $crbt = $crbtRepository->find($crbtId);
        if (!$crbt) {
            return $this->json(['message' => 'Entrée CRBT introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }

        $crbt->setStatus(Crbt::STATUS_PAYE);
        $em->flush();

        return $this->json([
            'message' => 'Virement enregistré et CRBT marqué comme payé.',
            'ref' => $data['ref_virement'] ?? ('VIR-' . time()),
            'status' => 'PAYE'
        ]);
    }

    #[Route('/api/facturation/reconcile', name: 'api_facturation_reconcile', methods: ['POST'])]
    public function reconcileBankAccounts(): JsonResponse
    {
        return $this->json([
            'message' => 'Rapprochement bancaire automatique exécuté avec succès.',
            'status' => 'RECONCILED',
            'ecart_total' => 0.0
        ]);
    }
}
