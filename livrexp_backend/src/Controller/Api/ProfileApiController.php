<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\CityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\String\Slugger\SluggerInterface;

#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class ProfileApiController extends AbstractController
{
    #[Route('/api/profile', name: 'api_profile_get', methods: ['GET'])]
    public function getProfile(CityRepository $cityRepository): JsonResponse
    {
        $user = $this->getUser();
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
        if (!$user instanceof User) {
            return $this->json(['message' => 'Non autorisé.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $cities = array_map(fn($c) => $c->getName(), $cityRepository->findBy([], ['name' => 'ASC']));

        $moroccanBanks = [
            'Attijariwafa bank',
            'Banque Populaire',
            'Bank of Africa',
            'BMCI',
            'CIH Bank',
            'Crédit Agricole du Maroc',
            'Crédit du Maroc',
            'Société Générale Maroc',
            'Al Barid Bank',
            'Bank Assafa',
            'Umnia Bank',
            'Bank Al Yousr',
            'BTI Bank',
            'CFG Bank',
            'Arab Bank Maroc',
            'Sabadell',
        ];

        return $this->json([
            'user' => [
                'id' => $user->getId(),
                'fullName' => $user->getFullName(),
                'email' => $user->getEmail(),
                'personalPhone' => $user->getBusinessPhone(),
                'businessPhone' => $user->getBusinessPhone(),
                'city' => $user->getCity(),
                'address' => $user->getAddress(),
                'businessName' => $user->getBusinessName(),
                'clientType' => $user->getClientType(),
                'ice' => $user->getIce(),
                'rc' => $user->getRc(),
                'website' => $user->getWebsite(),
                'labelMessage' => $user->getLabelMessage(),
                'packageOption' => $user->getPackageOption() ?? 'Ne pas ouvrir le colis',
                'bankName' => $user->getBankName(),
                'bankRib' => $user->getBankRib(),
                'returnReception' => $user->getReturnReception() ?? 'En Agence',
                'returnAgency' => $user->getReturnAgency(),
                'returnPhone' => $user->getReturnPhone(),
                'returnCity' => $user->getReturnCity(),
                'returnNeighborhood' => $user->getReturnNeighborhood(),
                'avatarUrl' => $user->getAvatar() ? '/uploads/avatars/' . $user->getAvatar() : null,
            ],
            'cities' => $cities,
            'moroccanBanks' => $moroccanBanks,
        ]);
    }

    #[Route('/api/profile/field', name: 'api_profile_field_update', methods: ['POST'])]
    public function updateField(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Non autorisé.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? $request->request->all();
        $field = (string) ($data['field'] ?? '');
        $value = trim((string) ($data['value'] ?? ''));

        switch ($field) {
            case 'full_name':
                if ($value !== '') $user->setFullName($value);
                break;
            case 'business_name':
                if ($value !== '') $user->setBusinessName($value);
                break;
            case 'personal_phone':
            case 'business_phone':
                if ($value !== '') $user->setBusinessPhone($value);
                break;
            case 'city':
                if ($value !== '') $user->setCity($value);
                break;
            case 'address':
                $user->setAddress($value !== '' ? $value : null);
                break;
            case 'client_type':
                $user->setClientType($value !== '' ? $value : null);
                break;
            case 'ice':
                $user->setIce($value !== '' ? $value : null);
                break;
            case 'website':
                $user->setWebsite($value !== '' ? $value : null);
                break;
            case 'rc':
                $user->setRc($value !== '' ? $value : null);
                break;
            case 'label_message':
                $user->setLabelMessage($value !== '' ? $value : null);
                break;
            case 'package_option':
                $user->setPackageOption($value !== '' ? $value : null);
                break;
            case 'bank_name':
                $user->setBankName($value !== '' ? $value : null);
                break;
            case 'bank_rib':
                $rib = preg_replace('/\D+/', '', $value) ?? '';
                if ($rib !== '' && strlen($rib) !== 24) {
                    return $this->json(['message' => 'Le RIB doit contenir exactement 24 chiffres.'], JsonResponse::HTTP_BAD_REQUEST);
                }
                $user->setBankRib($rib !== '' ? $rib : null);
                break;
            case 'return_reception':
                $user->setReturnReception($value !== '' ? $value : null);
                if ($value === 'En Agence') {
                    $user->setReturnPhone(null);
                    $user->setReturnCity(null);
                    $user->setReturnNeighborhood(null);
                } elseif ($value === 'En ramassage') {
                    $user->setReturnAgency(null);
                }
                break;
            case 'return_agency':
                $user->setReturnAgency($value !== '' ? $value : null);
                break;
            case 'return_phone':
                $user->setReturnPhone($value !== '' ? $value : null);
                break;
            case 'return_city':
                $user->setReturnCity($value !== '' ? $value : null);
                break;
            case 'return_neighborhood':
                $user->setReturnNeighborhood($value !== '' ? $value : null);
                break;
            case 'email':
                if ($value !== '' && $value !== $user->getEmail()) {
                    $existingUser = $entityManager->getRepository(User::class)->findOneBy(['email' => $value]);
                    if ($existingUser instanceof User && $existingUser->getId() !== $user->getId()) {
                        return $this->json(['message' => 'Cet email est déjà utilisé.'], JsonResponse::HTTP_BAD_REQUEST);
                    }
                    $user->setEmail($value);
                }
                break;
            default:
                return $this->json(['message' => 'Champ non pris en charge.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $entityManager->flush();

        return $this->json(['message' => 'Informations du profil mises à jour avec succès.']);
    }

    #[Route('/api/profile/avatar', name: 'api_profile_avatar_update', methods: ['POST'])]
    public function updateAvatar(
        Request $request,
        EntityManagerInterface $entityManager,
        SluggerInterface $slugger
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Non autorisé.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $avatarFile = $request->files->get('avatar');
        $removeAvatar = (string) $request->request->get('avatar_remove') === '1';
        $avatarsDir = $this->getParameter('kernel.project_dir') . '/public/uploads/avatars';
        $currentAvatar = $user->getAvatar();

        if (!is_dir($avatarsDir)) {
            mkdir($avatarsDir, 0775, true);
        }

        if ($removeAvatar && $currentAvatar) {
            $oldPath = $avatarsDir . '/' . $currentAvatar;
            if (is_file($oldPath)) {
                @unlink($oldPath);
            }
            $user->setAvatar(null);
        }

        if ($avatarFile instanceof UploadedFile && $avatarFile->isValid()) {
            if ($currentAvatar) {
                $oldPath = $avatarsDir . '/' . $currentAvatar;
                if (is_file($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $originalName = pathinfo($avatarFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeName = $slugger->slug($originalName ?: 'avatar')->lower();
            $extension = $avatarFile->guessExtension() ?: 'bin';
            $newFilename = sprintf('%s-%s.%s', $safeName, uniqid(), $extension);
            $avatarFile->move($avatarsDir, $newFilename);

            $user->setAvatar($newFilename);
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Photo de profil mise à jour avec succès.',
            'avatarUrl' => $user->getAvatar() ? '/uploads/avatars/' . $user->getAvatar() : null,
        ]);
    }

    #[Route('/api/profile/password', name: 'api_profile_password_update', methods: ['POST'])]
    public function updatePassword(
        Request $request,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Non autorisé.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? $request->request->all();
        $currentPassword = (string) ($data['current_password'] ?? '');
        $newPassword = (string) ($data['new_password'] ?? '');
        $confirmPassword = (string) ($data['confirm_password'] ?? '');

        if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
            return $this->json(['message' => 'Veuillez remplir tous les champs du mot de passe.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        if (!$passwordHasher->isPasswordValid($user, $currentPassword)) {
            return $this->json(['message' => 'Le mot de passe actuel est incorrect.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        if ($newPassword !== $confirmPassword) {
            return $this->json(['message' => 'Le nouveau mot de passe et la confirmation ne correspondent pas.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        if (strlen($newPassword) < 8) {
            return $this->json(['message' => 'Le nouveau mot de passe doit contenir au moins 8 caractères.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        if ($passwordHasher->isPasswordValid($user, $newPassword)) {
            return $this->json(['message' => 'Le nouveau mot de passe doit être différent de l\'ancien.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $user->setPassword($passwordHasher->hashPassword($user, $newPassword));
        $entityManager->flush();

        return $this->json(['message' => 'Mot de passe mis à jour avec succès.']);
    }
}
