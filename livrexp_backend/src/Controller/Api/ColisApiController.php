<?php

namespace App\Controller\Api;

use App\Entity\Colis;
use App\Repository\ColisRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_CLIENT')]
final class ColisApiController extends AbstractController
{
    #[Route('/api/colis', name: 'api_colis_list', methods: ['GET'])]
    public function getColis(ColisRepository $colisRepository): JsonResponse
    {
        $user = $this->getUser();
        $qb = $colisRepository->createQueryBuilder('c')
            ->select('c.id', 'c.orderNumber', 'c.trackingCode', 'c.productNature', 'c.createdAt', 'c.address', 'c.etat', 'c.statut', 'c.city', 'c.price', 'c.comment')
            ->orderBy('c.id', 'DESC');

        if (!$this->isGranted('ROLE_SUPERVISEUR') && $user instanceof User) {
            $qb->andWhere('c.createdBy = :user OR c.createdBy IS NULL')
               ->setParameter('user', $user);
        }

        $colisList = $qb->getQuery()->getArrayResult();

        $data = [];

        foreach ($colisList as $colis) {
            $statut = $colis['statut'] ?? Colis::STATUT_EN_ATTENTE;
            $etat = $colis['etat'] ?? Colis::ETAT_CREE;

            $data[] = [
                'id' => $colis['id'],
                'orderNumber' => $colis['orderNumber'],
                'trackingCode' => $colis['trackingCode'],
                'productNature' => $colis['productNature'] ?: 'Marchandise',
                'createdAt' => $colis['createdAt'] ? $colis['createdAt']->format('d/m/Y H:i') : '',
                'address' => $colis['address'] ?: '-',
                'etatLabel' => $etat,
                'etatBadgeClass' => match ($etat) {
                    Colis::ETAT_LIVRE => 'kt-badge-success',
                    Colis::ETAT_EN_PREPARATION => 'kt-badge-warning',
                    Colis::ETAT_EXPEDIE => 'kt-badge-info',
                    Colis::ETAT_RETOUR => 'kt-badge-destructive',
                    default => 'kt-badge-primary',
                },
                'statutLabel' => $statut,
                'statutBadgeClass' => match ($statut) {
                    Colis::STATUT_TERMINE => 'kt-badge-success',
                    Colis::STATUT_REPORTE => 'kt-badge-warning',
                    Colis::STATUT_ECHEC => 'kt-badge-destructive',
                    default => 'kt-badge-primary',
                },
                'city' => $colis['city'] ?: '-',
                'price' => (float) ($colis['price'] ?? 0.0),
                'comment' => $colis['comment'] ?: '-',
            ];
        }

        return $this->json($data);
    }

    #[Route('/api/colis/new', name: 'api_colis_new', methods: ['POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['message' => 'Données invalides.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $colis = new Colis();
        
        $user = $this->getUser();
        if ($user instanceof User) {
            $colis->setCreatedBy($user);
        }

        // Map fields
        $colis->setOrderNumber($data['orderNumber'] ?? '');
        $colis->setType($data['type'] ?? Colis::TYPE_SIMPLE);
        $colis->setRecipient($data['recipient'] ?? null);
        $colis->setCity($data['city'] ?? '');
        $colis->setAddress($data['address'] ?? '');
        $colis->setPrice((string)($data['price'] ?? 0.0));
        $colis->setPhoneNumber($data['phoneNumber'] ?? '');
        $colis->setNeighborhood($data['neighborhood'] ?? '');
        $colis->setProductNature($data['productNature'] ?? 'Marchandise');
        $colis->setComment($data['comment'] ?? null);
        $colis->setPackageOption($data['packageOption'] ?? 'Ne pas ouvrir le colis');
        $colis->setReplacePackage((bool)($data['replacePackage'] ?? false));
        
        if ($colis->isReplacePackage() && !empty($data['oldColis'])) {
            $colis->setOldOrderNumber($data['oldColis']);
        } else {
            $colis->setOldOrderNumber(null);
        }

        $colis->setFragile((bool)($data['fragile'] ?? false));
        $colis->setAllFragile((bool)($data['allFragile'] ?? false));
        
        $useCarton = (bool)($data['useCarton'] ?? false);
        if ($useCarton && !empty($data['cartonOption'])) {
            $colis->setCartonOption($data['cartonOption']);
        } else {
            $colis->setCartonOption(null);
        }

        try {
            $entityManager->persist($colis);
            $entityManager->flush();
        } catch (\Doctrine\DBAL\Exception\UniqueConstraintViolationException) {
            return $this->json(['message' => 'Numero de commande deja utilise. Veuillez saisir un numero unique.'], JsonResponse::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['message' => 'Une erreur est survenue lors de l\'ajout: ' . $e->getMessage()], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['message' => 'Colis ajoute avec succes.', 'id' => $colis->getId()]);
    }

    #[Route('/api/colis/pickup', name: 'api_colis_pickup', methods: ['GET'])]
    public function getPickupColis(ColisRepository $colisRepository): JsonResponse
    {
        $user = $this->getUser();
        $criteria = [
            'statut' => Colis::STATUT_EN_ATTENTE,
            'type' => Colis::TYPE_SIMPLE
        ];
        
        $qb = $colisRepository->createQueryBuilder('c')
            ->andWhere('c.statut = :statut')
            ->andWhere('c.type = :type')
            ->setParameter('statut', Colis::STATUT_EN_ATTENTE)
            ->setParameter('type', Colis::TYPE_SIMPLE)
            ->orderBy('c.id', 'DESC');

        if (!$this->isGranted('ROLE_SUPERVISEUR') && $user instanceof User) {
            $qb->andWhere('c.createdBy = :user OR c.createdBy IS NULL')
               ->setParameter('user', $user);
        }

        $colisList = $qb->getQuery()->getResult();
        $data = [];

        foreach ($colisList as $colis) {
            $statut = $colis->getStatut() ?? Colis::STATUT_EN_ATTENTE;
            $etat = $colis->getEtat() ?? Colis::ETAT_CREE;

            $data[] = [
                'id' => $colis->getId(),
                'orderNumber' => $colis->getOrderNumber(),
                'trackingCode' => $colis->getTrackingCode(),
                'productNature' => $colis->getProductNature() ?: 'Marchandise',
                'createdAt' => $colis->getCreatedAt() ? $colis->getCreatedAt()->format('d/m/Y H:i') : '',
                'address' => $colis->getAddress() ?: '-',
                'etatLabel' => $etat,
                'etatBadgeClass' => match ($etat) {
                    Colis::ETAT_LIVRE => 'kt-badge-success',
                    Colis::ETAT_EN_PREPARATION => 'kt-badge-warning',
                    Colis::ETAT_EXPEDIE => 'kt-badge-info',
                    Colis::ETAT_RETOUR => 'kt-badge-destructive',
                    default => 'kt-badge-primary',
                },
                'statutLabel' => $statut,
                'statutBadgeClass' => match ($statut) {
                    Colis::STATUT_TERMINE => 'kt-badge-success',
                    Colis::STATUT_REPORTE => 'kt-badge-warning',
                    Colis::STATUT_ECHEC => 'kt-badge-destructive',
                    default => 'kt-badge-primary',
                },
                'city' => $colis->getCity() ?: '-',
                'price' => (float) ($colis->getPrice() ?? 0.0),
                'comment' => $colis->getComment() ?: '-',
            ];
        }

        return $this->json($data);
    }

    #[Route('/api/colis/request-pickup-bulk', name: 'api_colis_request_pickup_bulk', methods: ['POST'])]
    public function requestPickupBulk(Request $request, ColisRepository $colisRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $ids = $data['ids'] ?? [];

        if (!\is_array($ids) || $ids === []) {
            return $this->json(['message' => 'Aucun colis sélectionné.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $updated = 0;
        foreach ($ids as $id) {
            $colis = $colisRepository->find((int) $id);
            if (!$colis) {
                continue;
            }

            if ($colis->getStatut() !== Colis::STATUT_EN_ATTENTE) {
                continue;
            }

            $colis->setStatut(Colis::STATUT_EN_COURS);
            $colis->setEtat(Colis::ETAT_EN_PREPARATION);
            ++$updated;
        }

        if ($updated > 0) {
            $entityManager->flush();
            return $this->json(['message' => sprintf('%d colis envoyé(s) en demande de ramassage.', $updated)]);
        }

        return $this->json(['message' => 'Aucun colis valide à traiter.'], JsonResponse::HTTP_BAD_REQUEST);
    }

    #[Route('/api/colis/import', name: 'api_colis_import', methods: ['POST'])]
    public function import(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var \Symfony\Component\HttpFoundation\File\UploadedFile|null $file */
        $file = $request->files->get('file');

        if (!$file) {
            return $this->json([
                'message' => 'Aucun fichier reçu.',
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        $xlsx = \Shuchkin\SimpleXLSX::parse($file->getRealPath());
        if (!$xlsx) {
            return $this->json([
                'message' => 'Erreur lors de la lecture du fichier Excel : ' . \Shuchkin\SimpleXLSX::parseError(),
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        $rows = $xlsx->rows();
        if (\count($rows) < 2) {
            return $this->json([
                'message' => 'Le fichier est vide ou ne contient que des en-têtes.',
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        $headers = array_shift($rows);
        if (!\is_array($headers)) {
            return $this->json([
                'message' => 'Le fichier est invalide (en-têtes manquants).',
            ], JsonResponse::HTTP_BAD_REQUEST);
        }
        
        $importedCount = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            if (!\is_array($row)) {
                $errors[] = sprintf("Ligne %d : Format invalide.", $index + 2);
                continue;
            }
            if (empty(array_filter($row))) {
                continue;
            }
            $data = array_combine($headers, $row);
            if (!\is_array($data)) {
                $errors[] = sprintf("Ligne %d : Format invalide.", $index + 2);
                continue;
            }

            // Minimal validation
            if (empty($data['N° Commande']) || empty($data['Ville']) || empty($data['Prix (DH)'])) {
                $errors[] = sprintf("Ligne %d : Champs obligatoires manquants (N° Commande, Ville, Prix).", $index + 2);
                continue;
            }

            $colis = new Colis();
            $user = $this->getUser();
            if ($user instanceof User) {
                $colis->setCreatedBy($user);
            }
            $colis->setOrderNumber((string) $data['N° Commande']);
            $colis->setRecipient($data['Destinataire'] ?? null);
            $colis->setPhoneNumber((string) ($data['Téléphone'] ?? ''));
            $colis->setCity($data['Ville']);
            $colis->setNeighborhood($data['Quartier'] ?? '');
            $colis->setAddress($data['Adresse'] ?? '');
            $colis->setPrice((string) $data['Prix (DH)']);
            $colis->setProductNature($data['Nature de Produit'] ?? 'Marchandise');

            // Map Type
            $typeInput = strtolower($data['Type'] ?? '');
            if (str_contains($typeInput, 'stock')) {
                $colis->setType(Colis::TYPE_STOCK);
            } else {
                $colis->setType(Colis::TYPE_SIMPLE);
            }

            $colis->setComment($data['Commentaire'] ?? null);
            $colis->setPackageOption($data['Option Colis'] ?? 'Ne pas ouvrir le colis');

            try {
                $entityManager->persist($colis);
                $importedCount++;
            } catch (\Exception $e) {
                $errors[] = sprintf("Ligne %d : Erreur lors de l'enregistrement (%s).", $index + 2, $e->getMessage());
            }
        }

        if ($importedCount > 0) {
            try {
                $entityManager->flush();
            } catch (\Doctrine\DBAL\Exception\UniqueConstraintViolationException $e) {
                return $this->json([
                    'message' => 'Erreur : Certains numéros de commande existent déjà dans la base de données.',
                ], JsonResponse::HTTP_BAD_REQUEST);
            } catch (\Exception $e) {
                return $this->json([
                    'message' => 'Une erreur est survenue lors de la sauvegarde : ' . $e->getMessage(),
                ], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
            }
        }

        if ($importedCount > 0) {
            return $this->json([
                'message' => sprintf('Import terminé : %d colis importé(s) avec succès.', $importedCount),
            ]);
        }

        return $this->json([
            'message' => 'Aucun colis n\'a pu être importé. Erreurs : ' . implode(', ', $errors),
        ], JsonResponse::HTTP_BAD_REQUEST);
    }

    #[Route('/api/colis/{id}', name: 'api_colis_show', methods: ['GET'])]
    public function show(Colis $colis): JsonResponse
    {
        if ($accessError = $this->checkColisOwnership($colis)) {
            return $accessError;
        }

        return $this->json([
            'id' => $colis->getId(),
            'orderNumber' => str_replace('CMD-', '', $colis->getOrderNumber() ?? ''),
            'type' => $colis->getType(),
            'recipient' => $colis->getRecipient(),
            'city' => $colis->getCity(),
            'address' => $colis->getAddress(),
            'price' => (float)($colis->getPrice() ?? 0.0),
            'phoneNumber' => $colis->getPhoneNumber(),
            'neighborhood' => $colis->getNeighborhood(),
            'productNature' => $colis->getProductNature() ?: 'Marchandise',
            'comment' => $colis->getComment(),
            'packageOption' => $colis->getPackageOption() ?: 'Ne pas ouvrir le colis',
            'replacePackage' => (bool)$colis->getOldOrderNumber(),
            'oldColis' => $colis->getOldOrderNumber(),
            'fragile' => (bool)$colis->isFragile(),
            'allFragile' => (bool)$colis->isAllFragile(),
            'useCarton' => (bool)$colis->getCartonOption(),
            'cartonOption' => $colis->getCartonOption()
        ]);
    }

    #[Route('/api/colis/{id}', name: 'api_colis_edit', methods: ['PUT'])]
    public function edit(Request $request, Colis $colis, EntityManagerInterface $entityManager): JsonResponse
    {
        if ($accessError = $this->checkColisOwnership($colis)) {
            return $accessError;
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['message' => 'Données invalides.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        // Map fields
        $colis->setOrderNumber($data['orderNumber'] ?? '');
        $colis->setType($data['type'] ?? Colis::TYPE_SIMPLE);
        $colis->setRecipient($data['recipient'] ?? null);
        $colis->setCity($data['city'] ?? '');
        $colis->setAddress($data['address'] ?? '');
        $colis->setPrice((string)($data['price'] ?? 0.0));
        $colis->setPhoneNumber($data['phoneNumber'] ?? '');
        $colis->setNeighborhood($data['neighborhood'] ?? '');
        $colis->setProductNature($data['productNature'] ?? 'Marchandise');
        $colis->setComment($data['comment'] ?? null);
        $colis->setPackageOption($data['packageOption'] ?? 'Ne pas ouvrir le colis');
        $colis->setReplacePackage((bool)($data['replacePackage'] ?? false));
        
        if ($colis->isReplacePackage() && !empty($data['oldColis'])) {
            $colis->setOldOrderNumber($data['oldColis']);
        } else {
            $colis->setOldOrderNumber(null);
        }

        $colis->setFragile((bool)($data['fragile'] ?? false));
        $colis->setAllFragile((bool)($data['allFragile'] ?? false));
        
        $useCarton = (bool)($data['useCarton'] ?? false);
        if ($useCarton && !empty($data['cartonOption'])) {
            $colis->setCartonOption($data['cartonOption']);
        } else {
            $colis->setCartonOption(null);
        }

        try {
            $entityManager->flush();
        } catch (\Doctrine\DBAL\Exception\UniqueConstraintViolationException) {
            return $this->json(['message' => 'Numero de commande deja utilise. Veuillez saisir un numero unique.'], JsonResponse::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['message' => 'Une erreur est survenue lors de la modification: ' . $e->getMessage()], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['message' => 'Colis modifié avec succès.']);
    }

    #[Route('/api/colis/{id}', name: 'api_colis_delete', methods: ['DELETE'])]
    public function delete(Colis $colis, EntityManagerInterface $entityManager): JsonResponse
    {
        if ($accessError = $this->checkColisOwnership($colis)) {
            return $accessError;
        }

        try {
            $entityManager->remove($colis);
            $entityManager->flush();
        } catch (\Exception $e) {
            return $this->json(['message' => 'Une erreur est survenue lors de la suppression: ' . $e->getMessage()], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['message' => 'Colis supprimé avec succès.']);
    }

    private function checkColisOwnership(Colis $colis): ?JsonResponse
    {
        if (!$this->isGranted('ROLE_SUPERVISEUR')) {
            $user = $this->getUser();
            if ($colis->getCreatedBy() !== null && $colis->getCreatedBy() !== $user) {
                return $this->json(['message' => 'Accès refusé à ce colis.'], JsonResponse::HTTP_FORBIDDEN);
            }
        }

        return null;
    }
}
