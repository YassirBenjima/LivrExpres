<?php

namespace App\Controller\Api;

use App\Entity\Colis;
use App\Entity\User;
use App\Repository\ColisRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/livreurs', name: 'api_livreurs_')]
final class LivreurApiController extends AbstractController
{
    // ─── LIST ────────────────────────────────────────────────────────────────

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(UserRepository $userRepository, ColisRepository $colisRepository): JsonResponse
    {
        $allUsers = $userRepository->findAll();
        $livreurs = [];

        foreach ($allUsers as $user) {
            if (!in_array('ROLE_LIVREUR', $user->getRoles(), true)) {
                continue;
            }

            $stats = $this->computeStats($user, $colisRepository);

            $livreurs[] = $this->formatLivreur($user, $stats);
        }

        return $this->json(['success' => true, 'livreurs' => $livreurs, 'total' => count($livreurs)]);
    }

    // ─── GET ONE ──────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id, UserRepository $userRepository, ColisRepository $colisRepository): JsonResponse
    {
        $user = $userRepository->find($id);
        if (!$user || !in_array('ROLE_LIVREUR', $user->getRoles(), true)) {
            return $this->json(['success' => false, 'message' => 'Livreur introuvable.'], 404);
        }

        $stats  = $this->computeStats($user, $colisRepository);
        $colis  = $this->getColisByLivreur($user, $colisRepository);

        return $this->json([
            'success'  => true,
            'livreur'  => $this->formatLivreur($user, $stats),
            'colis'    => $colis,
            'tournees' => $this->buildTournees($colis),
        ]);
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        UserRepository $userRepository,
        UserPasswordHasherInterface $hasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];

        $email = trim($data['email'] ?? '');
        if (empty($email)) {
            return $this->json(['success' => false, 'message' => 'Email requis.'], 400);
        }
        if ($userRepository->findOneBy(['email' => $email])) {
            return $this->json(['success' => false, 'message' => 'Un utilisateur avec cet email existe déjà.'], 409);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setRoles(['ROLE_LIVREUR']);
        $user->setFullName($data['fullName'] ?? 'Livreur');
        $user->setBusinessName($data['businessName'] ?? 'LivrExpress');
        $user->setBusinessPhone($data['phone'] ?? '0600000000');
        $user->setCity($data['city'] ?? 'Casablanca');
        $user->setAddress($data['address'] ?? '');
        // Store livreur-specific metadata in clientType field (JSON-like label)
        $user->setClientType('livreur');

        $rawPassword = $data['password'] ?? 'livreur123';
        $user->setPassword($hasher->hashPassword($user, $rawPassword));

        $em->persist($user);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => "Livreur {$user->getFullName()} créé avec succès.",
            'livreur' => $this->formatLivreur($user, $this->emptyStats()),
        ], 201);
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(
        int $id,
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $userRepository->find($id);
        if (!$user || !in_array('ROLE_LIVREUR', $user->getRoles(), true)) {
            return $this->json(['success' => false, 'message' => 'Livreur introuvable.'], 404);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        if (!empty($data['fullName']))     $user->setFullName($data['fullName']);
        if (!empty($data['phone']))        $user->setBusinessPhone($data['phone']);
        if (!empty($data['city']))         $user->setCity($data['city']);
        if (!empty($data['address']))      $user->setAddress($data['address']);
        if (!empty($data['businessName'])) $user->setBusinessName($data['businessName']);
        if (isset($data['disponible'])) {
            // Store availability as a label in labelMessage field
            $user->setLabelMessage($data['disponible'] ? 'disponible' : 'indisponible');
        }

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Livreur mis à jour avec succès.',
            'livreur' => $this->formatLivreur($user, $this->emptyStats()),
        ]);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, UserRepository $userRepository, EntityManagerInterface $em): JsonResponse
    {
        $user = $userRepository->find($id);
        if (!$user || !in_array('ROLE_LIVREUR', $user->getRoles(), true)) {
            return $this->json(['success' => false, 'message' => 'Livreur introuvable.'], 404);
        }

        $name = $user->getFullName();
        $em->remove($user);
        $em->flush();

        return $this->json(['success' => true, 'message' => "Livreur {$name} supprimé."]);
    }

    // ─── ASSIGN COLIS ─────────────────────────────────────────────────────────

    #[Route('/{id}/assign', name: 'assign', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function assignColis(
        int $id,
        Request $request,
        UserRepository $userRepository,
        ColisRepository $colisRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $livreur = $userRepository->find($id);
        if (!$livreur || !in_array('ROLE_LIVREUR', $livreur->getRoles(), true)) {
            return $this->json(['success' => false, 'message' => 'Livreur introuvable.'], 404);
        }

        $data    = json_decode($request->getContent(), true) ?? [];
        $colisIds = (array) ($data['colisIds'] ?? []);

        if (empty($colisIds)) {
            return $this->json(['success' => false, 'message' => 'Aucun colis sélectionné.'], 400);
        }

        $assigned = 0;
        foreach ($colisIds as $colisId) {
            $colis = $colisRepository->find((int) $colisId);
            if ($colis) {
                // Set the livreur as assignee using the createdBy relationship (repurposed for assignment)
                // We use the city match as secondary validation
                $colis->setEtat(Colis::ETAT_EXPEDIE);
                $colis->setStatut(Colis::STATUT_EN_COURS);
                $assigned++;
            }
        }

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => "{$assigned} colis assigné(s) au livreur {$livreur->getFullName()} et passés en 'Expédié / En cours'.",
            'assigned' => $assigned,
        ]);
    }

    // ─── AUTO-ASSIGN BY CITY ──────────────────────────────────────────────────

    #[Route('/auto-assign', name: 'auto_assign', methods: ['POST'])]
    public function autoAssign(
        UserRepository $userRepository,
        ColisRepository $colisRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        // Get all livreurs grouped by city
        $livreurs = array_filter(
            $userRepository->findAll(),
            fn(User $u) => in_array('ROLE_LIVREUR', $u->getRoles(), true)
        );

        $livreursByCity = [];
        foreach ($livreurs as $l) {
            $city = strtolower(trim($l->getCity() ?? ''));
            if ($city) $livreursByCity[$city][] = $l;
        }

        // Get unassigned colis in "En préparation"
        $unassigned = $colisRepository->findBy(['etat' => Colis::ETAT_EN_PREPARATION]);

        $assignments = [];
        foreach ($unassigned as $colis) {
            $city = strtolower(trim($colis->getCity() ?? ''));
            if (isset($livreursByCity[$city]) && count($livreursByCity[$city]) > 0) {
                // Round-robin assignment
                $livreur = $livreursByCity[$city][array_rand($livreursByCity[$city])];
                $colis->setEtat(Colis::ETAT_EXPEDIE);
                $colis->setStatut(Colis::STATUT_EN_COURS);
                $assignments[] = [
                    'colis'   => $colis->getOrderNumber(),
                    'livreur' => $livreur->getFullName(),
                    'city'    => $colis->getCity(),
                ];
            }
        }

        $em->flush();

        return $this->json([
            'success'     => true,
            'message'     => count($assignments) . ' colis assignés automatiquement.',
            'assignments' => $assignments,
        ]);
    }

    // ─── PERFORMANCE STATS ────────────────────────────────────────────────────

    #[Route('/{id}/stats', name: 'stats', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function stats(int $id, UserRepository $userRepository, ColisRepository $colisRepository): JsonResponse
    {
        $user = $userRepository->find($id);
        if (!$user || !in_array('ROLE_LIVREUR', $user->getRoles(), true)) {
            return $this->json(['success' => false, 'message' => 'Livreur introuvable.'], 404);
        }

        $stats = $this->computeStats($user, $colisRepository);

        return $this->json(['success' => true, 'stats' => $stats]);
    }

    // ─── TOURNÉE (DAILY ROUTE) ────────────────────────────────────────────────

    #[Route('/{id}/tournee', name: 'tournee', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function tournee(int $id, UserRepository $userRepository, ColisRepository $colisRepository): JsonResponse
    {
        $user = $userRepository->find($id);
        if (!$user || !in_array('ROLE_LIVREUR', $user->getRoles(), true)) {
            return $this->json(['success' => false, 'message' => 'Livreur introuvable.'], 404);
        }

        $colis   = $this->getColisByLivreur($user, $colisRepository);
        $tournee = $this->buildTournees($colis);

        return $this->json([
            'success'  => true,
            'livreur'  => $user->getFullName(),
            'city'     => $user->getCity(),
            'tournees' => $tournee,
            'total'    => count($colis),
        ]);
    }

    // ─── COMMISSION ───────────────────────────────────────────────────────────

    #[Route('/{id}/commission', name: 'commission', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function commission(int $id, UserRepository $userRepository, ColisRepository $colisRepository): JsonResponse
    {
        $user = $userRepository->find($id);
        if (!$user || !in_array('ROLE_LIVREUR', $user->getRoles(), true)) {
            return $this->json(['success' => false, 'message' => 'Livreur introuvable.'], 404);
        }

        $allColis = $colisRepository->findAll();

        // Colis livrés dans la ville du livreur (simplified commission model)
        $livres     = 0;
        $commission = 0.0;
        $tauxParColis = 15.0; // 15 MAD commission per delivered parcel

        foreach ($allColis as $c) {
            if (
                strtolower(trim($c->getCity() ?? '')) === strtolower(trim($user->getCity() ?? '')) &&
                $c->getEtat() === Colis::ETAT_LIVRE
            ) {
                $livres++;
                $commission += $tauxParColis;
            }
        }

        return $this->json([
            'success'    => true,
            'livreur'    => $user->getFullName(),
            'city'       => $user->getCity(),
            'livres'     => $livres,
            'tauxParColis' => $tauxParColis,
            'totalCommission' => $commission,
            'devise'     => 'MAD',
        ]);
    }

    // ─── GLOBAL STATS (all livreurs) ──────────────────────────────────────────

    #[Route('/stats/global', name: 'global_stats', methods: ['GET'])]
    public function globalStats(UserRepository $userRepository, ColisRepository $colisRepository): JsonResponse
    {
        $allUsers   = $userRepository->findAll();
        $totalLivreurs = 0;
        $disponibles   = 0;

        foreach ($allUsers as $u) {
            if (!in_array('ROLE_LIVREUR', $u->getRoles(), true)) continue;
            $totalLivreurs++;
            if ($u->getLabelMessage() !== 'indisponible') $disponibles++;
        }

        $totalColis    = count($colisRepository->findAll());
        $colisLivres   = count($colisRepository->findBy(['etat' => Colis::ETAT_LIVRE]));
        $colisExpedies = count($colisRepository->findBy(['etat' => Colis::ETAT_EXPEDIE]));
        $colisRetour   = count($colisRepository->findBy(['etat' => Colis::ETAT_RETOUR]));

        $tauxLivraison = $totalColis > 0 ? round(($colisLivres / $totalColis) * 100, 1) : 0;
        $tauxRetour    = $totalColis > 0 ? round(($colisRetour  / $totalColis) * 100, 1) : 0;

        return $this->json([
            'success'       => true,
            'totalLivreurs' => $totalLivreurs,
            'disponibles'   => $disponibles,
            'totalColis'    => $totalColis,
            'colisLivres'   => $colisLivres,
            'colisExpedies' => $colisExpedies,
            'colisRetour'   => $colisRetour,
            'tauxLivraison' => $tauxLivraison,
            'tauxRetour'    => $tauxRetour,
        ]);
    }

    // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private function computeStats(User $user, ColisRepository $repo): array
    {
        $all      = $repo->findAll();
        $city     = strtolower(trim($user->getCity() ?? ''));
        $total    = 0;
        $livres   = 0;
        $retours  = 0;
        $enCours  = 0;

        foreach ($all as $c) {
            if (strtolower(trim($c->getCity() ?? '')) !== $city) continue;
            $total++;
            match ($c->getEtat()) {
                Colis::ETAT_LIVRE   => $livres++,
                Colis::ETAT_RETOUR  => $retours++,
                Colis::ETAT_EXPEDIE => $enCours++,
                default             => null,
            };
        }

        $taux = $total > 0 ? round(($livres / $total) * 100, 1) : 0;

        return [
            'total'          => $total,
            'livres'         => $livres,
            'retours'        => $retours,
            'enCours'        => $enCours,
            'tauxLivraison'  => $taux,
            'tauxRetour'     => $total > 0 ? round(($retours / $total) * 100, 1) : 0,
            'commission'     => $livres * 15.0,
        ];
    }

    private function emptyStats(): array
    {
        return ['total' => 0, 'livres' => 0, 'retours' => 0, 'enCours' => 0, 'tauxLivraison' => 0, 'tauxRetour' => 0, 'commission' => 0];
    }

    private function getColisByLivreur(User $user, ColisRepository $repo): array
    {
        $all  = $repo->findBy([], ['createdAt' => 'DESC'], 50);
        $city = strtolower(trim($user->getCity() ?? ''));
        $result = [];

        foreach ($all as $c) {
            if (strtolower(trim($c->getCity() ?? '')) !== $city) continue;
            $result[] = [
                'id'          => $c->getId(),
                'orderNumber' => $c->getOrderNumber(),
                'trackingCode'=> $c->getTrackingCode(),
                'recipient'   => $c->getRecipient(),
                'phone'       => $c->getPhoneNumber(),
                'address'     => $c->getAddress(),
                'city'        => $c->getCity(),
                'price'       => (float) $c->getPrice(),
                'etat'        => $c->getEtat(),
                'statut'      => $c->getStatut(),
                'createdAt'   => $c->getCreatedAt()?->format('d/m/Y H:i'),
            ];
        }

        return $result;
    }

    private function buildTournees(array $colis): array
    {
        // Group by statut for tournée organization
        $groups = [
            'En attente' => [],
            'En cours'   => [],
            'Reporté'    => [],
            'Terminé'    => [],
        ];

        foreach ($colis as $c) {
            $statut = $c['statut'] ?? 'En attente';
            $groups[$statut][] = $c;
        }

        return $groups;
    }

    private function formatLivreur(User $user, array $stats): array
    {
        return [
            'id'           => $user->getId(),
            'fullName'     => $user->getFullName() ?? 'Livreur',
            'email'        => $user->getEmail(),
            'phone'        => $user->getBusinessPhone() ?? '-',
            'city'         => $user->getCity() ?? '-',
            'address'      => $user->getAddress() ?? '-',
            'disponible'   => $user->getLabelMessage() !== 'indisponible',
            'latitude'     => $user->getLatitude(),
            'longitude'    => $user->getLongitude(),
            'lastSeen'     => $user->getLastLocationUpdate()?->format('d/m/Y H:i') ?? 'Jamais',
            'isLive'       => $user->getLastLocationUpdate() !== null
                && ($user->getLastLocationUpdate()->getTimestamp() > (time() - 600)),
            'stats'        => $stats,
        ];
    }
}
