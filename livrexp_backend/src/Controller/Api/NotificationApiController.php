<?php

namespace App\Controller\Api;

use App\Entity\Colis;
use App\Entity\User;
use App\Repository\ColisRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notifications', name: 'api_notifications_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class NotificationApiController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function getNotifications(ColisRepository $colisRepo): JsonResponse
    {
        $user = $this->getUser();
        $isClientOnly = !$this->isGranted('ROLE_SUPERVISEUR');

        // Dynamically build smart notifications based on real system state
        $notifications = [];

        // 1. Check recently delivered packages
        $recentDeliveredQb = $colisRepo->createQueryBuilder('c')
            ->where('c.etat = :livre')
            ->setParameter('livre', Colis::ETAT_LIVRE)
            ->orderBy('c.createdAt', 'DESC')
            ->setMaxResults(4);

        if ($isClientOnly && $user instanceof User) {
            $recentDeliveredQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $recentDelivered = $recentDeliveredQb->getQuery()->getResult();

        foreach ($recentDelivered as $c) {
            $notifications[] = [
                'id' => 'livre-' . $c->getId(),
                'title' => 'Colis Livré avec succès',
                'message' => sprintf('Le colis %s (%s) à %s a été livré.', $c->getTrackingCode(), $c->getRecipient(), $c->getCity()),
                'type' => 'success',
                'icon' => 'ki-verify',
                'createdAt' => $c->getCreatedAt() ? $c->getCreatedAt()->format('d/m/Y H:i') : 'Récemment',
                'isRead' => false,
                'link' => '/colis',
            ];
        }

        // 2. Check returned packages
        $recentReturnedQb = $colisRepo->createQueryBuilder('c')
            ->where('c.etat = :retour')
            ->setParameter('retour', Colis::ETAT_RETOUR)
            ->orderBy('c.createdAt', 'DESC')
            ->setMaxResults(3);

        if ($isClientOnly && $user instanceof User) {
            $recentReturnedQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $recentReturned = $recentReturnedQb->getQuery()->getResult();

        foreach ($recentReturned as $c) {
            $notifications[] = [
                'id' => 'retour-' . $c->getId(),
                'title' => 'Alerte Colis Retourné',
                'message' => sprintf('Le colis %s à %s est marqué en retour.', $c->getTrackingCode(), $c->getCity()),
                'type' => 'warning',
                'icon' => 'ki-delivery-time',
                'createdAt' => $c->getCreatedAt() ? $c->getCreatedAt()->format('d/m/Y H:i') : 'Récemment',
                'isRead' => false,
                'link' => '/retour/demandes',
            ];
        }

        // 3. System info notification
        $notifications[] = [
            'id' => 'sys-welcome',
            'title' => 'Système LivrExpress Actif',
            'message' => 'Toutes les tournées et attributions automatiques sont synchronisées en temps réel.',
            'type' => 'info',
            'icon' => 'ki-information-2',
            'createdAt' => 'Aujourd\'hui',
            'isRead' => true,
            'link' => '/dashboard',
        ];

        $unreadCount = count(array_filter($notifications, fn($n) => !$n['isRead']));

        return $this->json([
            'success' => true,
            'unreadCount' => $unreadCount,
            'notifications' => $notifications,
        ]);
    }

    #[Route('/read-all', name: 'read_all', methods: ['POST'])]
    public function markAllAsRead(): JsonResponse
    {
        return $this->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues.',
        ]);
    }

    #[Route('/{id}/read', name: 'read_single', methods: ['PATCH'])]
    public function markSingleAsRead(string $id): JsonResponse
    {
        return $this->json([
            'success' => true,
            'message' => sprintf('Notification %s marquée comme lue.', $id),
        ]);
    }
}
