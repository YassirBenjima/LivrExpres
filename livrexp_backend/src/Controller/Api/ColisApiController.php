<?php

namespace App\Controller\Api;

use App\Entity\Colis;
use App\Repository\ColisRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class ColisApiController extends AbstractController
{
    #[Route('/api/colis', name: 'api_colis_list', methods: ['GET'])]
    public function getColis(ColisRepository $colisRepository): JsonResponse
    {
        $colisList = $colisRepository->findBy([], ['id' => 'DESC']);
        $data = [];

        foreach ($colisList as $colis) {
            $statut = $colis->getStatut() ?? Colis::STATUT_EN_ATTENTE;
            
            // "Liste des colis" should only display packages requested for pickup.
            if ($statut === Colis::STATUT_EN_ATTENTE) {
                continue;
            }

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
}
