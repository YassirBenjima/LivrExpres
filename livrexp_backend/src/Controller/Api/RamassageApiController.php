<?php

namespace App\Controller\Api;

use App\Entity\PickupRequest;
use App\Entity\User;
use App\Repository\CityRepository;
use App\Repository\PickupRequestRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_CLIENT')]
#[Route('/api/ramassage')]
final class RamassageApiController extends AbstractController
{
    private const STATUS_LABELS = [
        'pending' => 'En attente',
        'confirmed' => 'Confirmé',
        'picked_up' => 'Ramassé',
        'cancelled' => 'Annulé',
    ];

    #[Route('', name: 'api_ramassage_index', methods: ['GET'])]
    public function index(Request $request, PickupRequestRepository $pickupRequestRepository): JsonResponse
    {
        $search = trim((string) $request->query->get('q', ''));
        $selectedStatut = trim((string) $request->query->get('statut', ''));

        $pickups = $pickupRequestRepository->findAllForList($search, $selectedStatut);

        $data = array_map(function (PickupRequest $pickup) {
            return [
                'id' => $pickup->getId(),
                'phone' => $pickup->getPhone(),
                'supplierPhone' => $pickup->getSupplierPhone(),
                'type' => $pickup->getType() ?: 'simple',
                'productNameSnapshot' => $pickup->getProductNameSnapshot() ?: '-',
                'city' => $pickup->getCity(),
                'neighborhood' => $pickup->getNeighborhood(),
                'address' => $pickup->getAddress(),
                'note' => $pickup->getNote() ?: '-',
                'createdAt' => $pickup->getCreatedAt() ? $pickup->getCreatedAt()->format('d/m/Y H:i') : '-',
                'createdAtIso' => $pickup->getCreatedAt() ? $pickup->getCreatedAt()->format('Y-m-d\TH:i:s') : null,
                'scheduledAt' => $pickup->getScheduledAt() ? $pickup->getScheduledAt()->format('Y-m-d\TH:i:s') : null,
                'status' => $pickup->getStatus(),
                'statusLabel' => self::STATUS_LABELS[$pickup->getStatus()] ?? $pickup->getStatus(),
                'hasLabels' => $pickup->hasLabels(),
                'assignedDriver' => $pickup->getAssignedDriver() ?: '-',
                'createdBy' => $pickup->getCreatedBy() ? ($pickup->getCreatedBy()->getFullName() ?: $pickup->getCreatedBy()->getEmail()) : '-',
            ];
        }, $pickups);

        return $this->json([
            'pickups' => $data,
            'statuts_possibles' => ['pending', 'confirmed', 'picked_up', 'cancelled'],
            'statut_labels' => self::STATUS_LABELS,
        ]);
    }

    #[Route('/stats', name: 'api_ramassage_stats', methods: ['GET'])]
    public function stats(PickupRequestRepository $pickupRequestRepository): JsonResponse
    {
        $stats = $pickupRequestRepository->countByStatus();
        return $this->json([
            'stats' => $stats,
            'statut_labels' => self::STATUS_LABELS,
        ]);
    }

    #[Route('/new', name: 'api_ramassage_new', methods: ['POST'])]
    public function new(
        Request $request,
        EntityManagerInterface $entityManager,
        CityRepository $cityRepository
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Vous devez être connecté.'], Response::HTTP_UNAUTHORIZED);
        }

        $payload = json_decode($request->getContent(), true) ?: $request->request->all();

        $phone = trim((string) ($payload['phone'] ?? ''));
        $supplierPhone = trim((string) ($payload['supplier_phone'] ?? $payload['supplierPhone'] ?? ''));
        $city = trim((string) ($payload['city'] ?? ''));
        $neighborhood = trim((string) ($payload['neighborhood'] ?? ''));
        $address = trim((string) ($payload['address'] ?? ''));
        $productName = trim((string) ($payload['product_name'] ?? $payload['productName'] ?? ''));
        $note = trim((string) ($payload['note'] ?? ''));
        $hasLabels = isset($payload['has_labels']) ? (bool)$payload['has_labels'] : (isset($payload['hasLabels']) ? (bool)$payload['hasLabels'] : true);
        $type = trim((string) ($payload['type'] ?? 'simple'));

        if ($phone === '') {
            return $this->json(['message' => 'Le numéro de téléphone est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }
        if ($city === '') {
            return $this->json(['message' => 'La ville est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }
        if ($cityRepository->count(['name' => $city]) === 0) {
            return $this->json(['message' => 'Veuillez choisir une ville valide.'], Response::HTTP_BAD_REQUEST);
        }
        if ($neighborhood === '') {
            return $this->json(['message' => 'Le quartier est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }
        if ($address === '') {
            return $this->json(['message' => "L'adresse est obligatoire."], Response::HTTP_BAD_REQUEST);
        }
        if ($productName === '') {
            return $this->json(['message' => 'La nature du produit est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        $pickup = new PickupRequest();
        $pickup->setPhone($phone);
        $pickup->setSupplierPhone($supplierPhone !== '' ? $supplierPhone : null);
        $pickup->setCity($city);
        $pickup->setNeighborhood($neighborhood);
        $pickup->setAddress($address);
        $pickup->setProductNameSnapshot($productName);
        $pickup->setNote($note !== '' ? $note : null);
        $pickup->setHasLabels($hasLabels);
        $pickup->setType(\in_array($type, ['simple', 'stock'], true) ? $type : 'simple');
        $pickup->setCreatedBy($user);
        $pickup->setStatus('pending');

        $entityManager->persist($pickup);
        $entityManager->flush();

        return $this->json([
            'message' => 'Demande de ramassage créée avec succès.',
            'id' => $pickup->getId()
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}/status', name: 'api_ramassage_update_status', methods: ['POST'])]
    public function updateStatus(Request $request, PickupRequest $pickup, EntityManagerInterface $entityManager): JsonResponse
    {
        $payload = json_decode($request->getContent(), true) ?: $request->request->all();
        $newStatus = trim((string) ($payload['status'] ?? ''));

        $allowed = ['pending', 'confirmed', 'picked_up', 'cancelled'];
        if (!\in_array($newStatus, $allowed, true)) {
            return $this->json(['message' => 'Statut invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $pickup->setStatus($newStatus);
        $entityManager->flush();

        return $this->json([
            'message' => sprintf('Statut mis à jour : %s.', self::STATUS_LABELS[$newStatus] ?? $newStatus),
            'status' => $newStatus,
            'statusLabel' => self::STATUS_LABELS[$newStatus] ?? $newStatus,
        ]);
    }

    #[Route('/calendar/events', name: 'api_ramassage_calendar_events', methods: ['GET'])]
    public function calendarEvents(PickupRequestRepository $pickupRequestRepository): JsonResponse
    {
        $pickups = $pickupRequestRepository->findAll();
        $events = [];

        foreach ($pickups as $pickup) {
            $statusColors = [
                'pending' => 'info',
                'confirmed' => 'primary',
                'picked_up' => 'success',
                'cancelled' => 'danger'
            ];
            $color = $statusColors[$pickup->getStatus()] ?? 'primary';
            $date = $pickup->getScheduledAt() ? $pickup->getScheduledAt()->format('Y-m-d\TH:i:s') : ($pickup->getCreatedAt() ? $pickup->getCreatedAt()->format('Y-m-d\TH:i:s') : date('Y-m-d\TH:i:s'));

            $events[] = [
                'id' => $pickup->getId(),
                'title' => ($pickup->getProductNameSnapshot() ?: 'Ramassage') . ' - ' . $pickup->getCity(),
                'start' => $date,
                'className' => 'fc-event-' . $color,
                'extendedProps' => [
                    'status' => $pickup->getStatus(),
                    'statusLabel' => self::STATUS_LABELS[$pickup->getStatus()] ?? $pickup->getStatus(),
                    'phone' => $pickup->getPhone(),
                    'address' => $pickup->getAddress(),
                    'city' => $pickup->getCity(),
                    'type' => $pickup->getType() ?: 'simple',
                    'assignedDriver' => $pickup->getAssignedDriver() ?: '-'
                ]
            ];
        }

        return $this->json($events);
    }

    #[Route('/{id}/calendar-move', name: 'api_ramassage_calendar_move', methods: ['POST'])]
    public function calendarMove(Request $request, PickupRequest $pickup, EntityManagerInterface $entityManager): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?: $request->request->all();
        if (!isset($data['newDate'])) {
            return $this->json(['success' => false, 'message' => 'Missing date'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $newDate = new \DateTimeImmutable($data['newDate']);
            $pickup->setScheduledAt($newDate);
            $entityManager->flush();
            return $this->json(['success' => true]);
        } catch (\Exception $e) {
            return $this->json(['success' => false, 'message' => 'Invalid date format'], Response::HTTP_BAD_REQUEST);
        }
    }
}
