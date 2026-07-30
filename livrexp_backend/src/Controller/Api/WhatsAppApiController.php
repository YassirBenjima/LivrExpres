<?php

namespace App\Controller\Api;

use App\Entity\Colis;
use App\Repository\ColisRepository;
use App\Service\WhatsAppService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/whatsapp')]
class WhatsAppApiController extends AbstractController
{
    public function __construct(
        private readonly WhatsAppService $whatsAppService,
        private readonly ColisRepository $colisRepository,
        private readonly EntityManagerInterface $entityManager
    ) {}

    /**
     * Send or resend a WhatsApp notification for a specific parcel
     */
    #[Route('/send/{id}', name: 'api_whatsapp_send', methods: ['POST'])]
    public function sendNotification(Colis $colis, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $customStatut = $data['statut'] ?? null;

        $result = $this->whatsAppService->sendNotification($colis, $customStatut);

        return $this->json($result);
    }

    /**
     * Test WhatsApp messaging with custom phone and message
     */
    #[Route('/test', name: 'api_whatsapp_test', methods: ['POST'])]
    public function testSend(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $phone = $data['phone'] ?? null;
        $message = $data['message'] ?? 'Test notification LivrExpress via WhatsApp';

        if (!$phone) {
            return $this->json(['success' => false, 'message' => 'Le numéro de téléphone est requis.'], Response::HTTP_BAD_REQUEST);
        }

        $result = $this->whatsAppService->sendWhatsAppMessage($phone, $message);

        return $this->json($result);
    }

    /**
     * Verify OTP Code submitted by Livreur / Delivery Agent
     */
    #[Route('/verify-otp', name: 'api_whatsapp_verify_otp', methods: ['POST'])]
    public function verifyOtp(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $trackingCode = $data['trackingCode'] ?? $data['orderNumber'] ?? null;
        $submittedOtp = trim((string) ($data['otpCode'] ?? ''));

        if (!$trackingCode || !$submittedOtp) {
            return $this->json([
                'success' => false,
                'message' => 'Code de suivi et code OTP requis.'
            ], Response::HTTP_BAD_REQUEST);
        }

        $colis = $this->colisRepository->findOneBy(['trackingCode' => $trackingCode])
            ?? $this->colisRepository->findOneBy(['orderNumber' => $trackingCode]);

        if (!$colis) {
            return $this->json([
                'success' => false,
                'message' => 'Colis introuvable.'
            ], Response::HTTP_NOT_FOUND);
        }

        $expectedOtp = $colis->getOtpCode();

        if (!$expectedOtp || $expectedOtp !== $submittedOtp) {
            return $this->json([
                'success' => false,
                'message' => 'Code OTP incorrect. Veuillez demander au client le code reçu par WhatsApp.'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // OTP is valid! Update parcel status to Terminé / Livré
        $colis->setStatut(Colis::STATUT_TERMINE);
        $colis->setEtat(Colis::ETAT_LIVRE);
        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Code OTP validé avec succès ! Le colis a été marqué comme Livré.',
            'colis' => [
                'id' => $colis->getId(),
                'trackingCode' => $colis->getTrackingCode(),
                'statut' => $colis->getStatut(),
                'etat' => $colis->getEtat()
            ]
        ]);
    }

    /**
     * View recent WhatsApp log entries
     */
    #[Route('/logs', name: 'api_whatsapp_logs', methods: ['GET'])]
    public function getLogs(): JsonResponse
    {
        $logPath = $this->getParameter('kernel.project_dir') . '/var/log/whatsapp_notifications.log';

        if (!file_exists($logPath)) {
            return $this->json([
                'success' => true,
                'logs' => 'Aucune notification WhatsApp enregistrée pour le moment.'
            ]);
        }

        $content = file_get_contents($logPath);
        $lines = array_filter(explode("-----------------------------------\n", $content));
        $recent = array_slice(array_reverse($lines), 0, 20);

        return $this->json([
            'success' => true,
            'logCount' => count($lines),
            'recent' => $recent
        ]);
    }
}
