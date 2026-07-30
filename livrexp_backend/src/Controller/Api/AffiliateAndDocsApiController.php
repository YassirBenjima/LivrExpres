<?php

namespace App\Controller\Api;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_CLIENT')]
final class AffiliateAndDocsApiController extends AbstractController
{
    #[Route('/api/affiliate', name: 'api_affiliate_info', methods: ['GET'])]
    public function getAffiliateInfo(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Non autorisé.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $userId = (string) $user->getId();
        $host = rtrim($request->getSchemeAndHttpHost(), '/');
        $fullLink = $host . '/register?ref=' . $userId;
        $shortLink = $host . '/r/' . $userId;

        return $this->json([
            'next_payment' => 0,
            'total_referred' => 0,
            'total_earnings' => 0,
            'full_link' => $fullLink,
            'short_link' => $shortLink,
        ]);
    }

    #[Route('/api/api-docs', name: 'api_docs_info', methods: ['GET'])]
    public function getApiDocsInfo(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Non autorisé.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'api_key' => $user->getApiKey(),
            'host' => $request->getHttpHost(),
            'schemeAndHttpHost' => $request->getSchemeAndHttpHost(),
        ]);
    }

    #[Route('/api/api-docs/generate-key', name: 'api_docs_generate_key', methods: ['POST'])]
    public function generateApiKey(EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Non autorisé.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $newKey = bin2hex(random_bytes(16));
        $user->setApiKey($newKey);
        $entityManager->flush();

        return $this->json([
            'message' => 'Votre nouvelle clé API a été générée avec succès.',
            'api_key' => $newKey,
        ]);
    }
}
