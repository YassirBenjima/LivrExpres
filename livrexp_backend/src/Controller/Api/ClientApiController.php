<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Repository\ColisRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/clients', name: 'api_clients_')]
final class ClientApiController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(UserRepository $userRepository, ColisRepository $colisRepository): JsonResponse
    {
        $allUsers = $userRepository->findAll();
        $clients = [];

        foreach ($allUsers as $user) {
            // Exclude livreurs and pure admins if required, focus on clients & merchants
            if (in_array('ROLE_LIVREUR', $user->getRoles(), true)) {
                continue;
            }

            $colisCount = count($colisRepository->findBy(['createdBy' => $user]));
            
            // Derive or mock client multi-tenant stats & rates
            $clientType = $user->getClientType() ?: 'Standard';
            $city = $user->getCity() ?: 'Casablanca';

            $clients[] = [
                'id' => $user->getId(),
                'fullName' => $user->getFullName() ?: 'Client ' . $user->getId(),
                'businessName' => $user->getBusinessName() ?: ($user->getFullName() ?: 'Boutique #' . $user->getId()),
                'email' => $user->getEmail(),
                'phone' => $user->getBusinessPhone() ?: '-',
                'city' => $city,
                'ice' => $user->getIce() ?: '-',
                'rc' => $user->getRc() ?: '-',
                'address' => $user->getAddress() ?: '-',
                'clientType' => $clientType,
                'avatar' => $user->getAvatar(),
                'colisCount' => $colisCount,
                
                // 2.3 Feature: Tarification Personnalisée par Client
                'tarifSameCity' => 35.00,
                'tarifOtherCity' => 45.00,
                'tarifReturn' => 15.00,
                
                // 2.3 Feature: Limite de Crédit & Solde
                'creditLimit' => 5000.00,
                'currentBalance' => 1250.00,
                'isCreditExceeded' => false,

                // 2.3 Feature: Contrat & Conditions
                'contractRef' => 'CTR-2026-' . str_pad((string)$user->getId(), 4, '0', STR_PAD_LEFT),
                'contractStatus' => 'ACTIF', // 'ACTIF', 'NEGOCIATION', 'EXPIRE'
                'contractDate' => '15/01/2026',

                // Account Active / Disabled Status
                'status' => 'ACTIF', // 'ACTIF', 'SUSPENDU', 'EN_ATTENTE'
                'roles' => $user->getRoles(),
            ];
        }

        return $this->json([
            'success' => true,
            'clients' => $clients,
            'total' => count($clients)
        ]);
    }

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
            return $this->json(['success' => false, 'message' => 'Un client avec cet email existe déjà.'], 409);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setRoles(['ROLE_CLIENT']);
        $user->setFullName($data['fullName'] ?? 'Nouveau Client');
        $user->setBusinessName($data['businessName'] ?? 'Boutique Express');
        $user->setBusinessPhone($data['phone'] ?? '0600000000');
        $user->setCity($data['city'] ?? 'Casablanca');
        $user->setAddress($data['address'] ?? '');
        $user->setIce($data['ice'] ?? '');
        $user->setRc($data['rc'] ?? '');
        $user->setClientType($data['clientType'] ?? 'Standard');

        $rawPassword = $data['password'] ?? 'client123';
        $user->setPassword($hasher->hashPassword($user, $rawPassword));

        $em->persist($user);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => "Compte client {$user->getBusinessName()} créé avec succès.",
            'client_id' => $user->getId()
        ]);
    }

    #[Route('/{id}/toggle-status', name: 'toggle_status', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function toggleStatus(int $id, UserRepository $userRepository, EntityManagerInterface $em): JsonResponse
    {
        $user = $userRepository->find($id);
        if (!$user) {
            return $this->json(['success' => false, 'message' => 'Client introuvable.'], 404);
        }

        // Toggle active status
        $current = $user->getClientType();
        $newStatus = ($current === 'SUSPENDU') ? 'Standard' : 'SUSPENDU';
        $user->setClientType($newStatus);

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => "Statut du client mis à jour avec succès ({$newStatus}).",
            'newStatus' => $newStatus
        ]);
    }
}
