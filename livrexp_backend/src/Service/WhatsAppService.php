<?php

namespace App\Service;

use App\Entity\Colis;
use Psr\Log\LoggerInterface;

class WhatsAppService
{
    private string $token;
    private string $phoneId;
    private ?LoggerInterface $logger;

    public function __construct(?LoggerInterface $logger = null)
    {
        $this->token = $_ENV['WHATSAPP_TOKEN'] ?? $_SERVER['WHATSAPP_TOKEN'] ?? '';
        $this->phoneId = $_ENV['WHATSAPP_PHONE_ID'] ?? $_SERVER['WHATSAPP_PHONE_ID'] ?? '';
        $this->logger = $logger;
    }

    /**
     * Send status update notification for a parcel
     */
    public function sendNotification(Colis $colis, ?string $statut = null): array
    {
        $currentStatut = $statut ?? $colis->getStatut() ?? $colis->getEtat();
        $phoneNumber = $colis->getPhoneNumber();

        if (!$phoneNumber) {
            return ['success' => false, 'message' => 'Aucun numéro de téléphone fourni pour le colis.'];
        }

        // Generate OTP code if status is En cours or Out for delivery
        $otp = $colis->getOtpCode() ?? $colis->generateOtpCode();

        $message = $this->buildMessage($colis, $currentStatut, $otp);

        if (!$message) {
            return ['success' => true, 'message' => 'Statut non configuré pour alerte WhatsApp.'];
        }

        return $this->sendWhatsAppMessage($phoneNumber, $message);
    }

    /**
     * Format WhatsApp notification message based on status
     */
    public function buildMessage(Colis $colis, string $statut, string $otp): ?string
    {
        $trackingCode = $colis->getTrackingCode() ?? $colis->getOrderNumber();
        $recipient = $colis->getRecipient() ?? 'Client(e)';
        $price = number_format((float) ($colis->getPrice() ?? 0), 2, '.', ' ');
        $city = $colis->getCity() ?? 'votre ville';
        $trackingUrl = "http://localhost:5173/suivi?code=" . urlencode((string) ($trackingCode ?? ''));
        $etat = $colis->getEtat();

        // 1. Initial parcel creation / pending status (Créé / En attente / En préparation)
        if ($statut === Colis::STATUT_EN_ATTENTE || $etat === Colis::ETAT_CREE || $etat === Colis::ETAT_EN_PREPARATION) {
            return "📦 *LivrExpress - Colis Enregistré*\n\n" .
                "Bonjour *{$recipient}*,\n" .
                "Votre colis *#{$trackingCode}* à destination de {$city} (Montant: *{$price} DH*) a bien été enregistré.\n\n" .
                "🔗 *Suivez votre colis ici :*\n{$trackingUrl}\n\n" .
                "Merci pour votre confiance ! 🙏";
        }

        // 2. Out for delivery / Expedited status (En cours / Expédié / En cours de livraison)
        if ($statut === Colis::STATUT_EN_COURS || $etat === Colis::ETAT_EXPEDIE || $statut === 'En cours de livraison') {
            return "🚨 *LivrExpress - Livreur en route !*\n\n" .
                "Bonjour *{$recipient}*,\n" .
                "Votre livreur est en route avec votre colis *#{$trackingCode}* à destination de {$city}.\n\n" .
                "🔑 *Votre Code de Livraison (OTP) :* `{$otp}`\n" .
                "💵 *Montant à régler :* *{$price} DH*\n\n" .
                "Veuillez communiquer ce code OTP à 4 chiffres au livreur lors de la remise.\n" .
                "🔗 *Suivi direct :* {$trackingUrl}";
        }

        // 3. Delivered status (Terminé / Livré)
        if ($statut === Colis::STATUT_TERMINE || $etat === Colis::ETAT_LIVRE) {
            return "🎉 *LivrExpress - Colis Livré !*\n\n" .
                "Bonjour *{$recipient}*,\n" .
                "Votre colis *#{$trackingCode}* a été livré avec succès.\n\n" .
                "Merci d'avoir choisi LivrExpress pour vos expéditions ! 📦✨";
        }

        // 4. Postponed status (Reporté)
        if ($statut === Colis::STATUT_REPORTE) {
            return "⏳ *LivrExpress - Livraison Reportée*\n\n" .
                "Bonjour *{$recipient}*,\n" .
                "La livraison de votre colis *#{$trackingCode}* a été reprogrammée.\n\n" .
                "🔗 *Détails de suivi :* {$trackingUrl}";
        }

        // 5. Returned / Failed status (Échec / Retourné)
        if ($statut === Colis::STATUT_ECHEC || $etat === Colis::ETAT_RETOUR) {
            return "⚠️ *LivrExpress - Échec de Livraison*\n\n" .
                "Bonjour *{$recipient}*,\n" .
                "Le colis *#{$trackingCode}* n'a pas pu être livré et est retourné à l'expéditeur.\n\n" .
                "🔗 *Détails :* {$trackingUrl}";
        }

        return null;
    }

    /**
     * Send HTTP request to Meta WhatsApp Business Cloud API
     */
    public function sendWhatsAppMessage(string $phoneNumber, string $message): array
    {
        // Sanitize phone number to international format (e.g. 2126XXXXXXXX)
        $cleanPhone = preg_replace('/\D+/', '', $phoneNumber);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '212' . substr($cleanPhone, 1);
        }

        $logDir = __DIR__ . '/../../var/log';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0777, true);
        }
        $logFile = $logDir . '/whatsapp_notifications.log';

        // Check if Meta credentials are provided
        if (!empty($this->token) && !empty($this->phoneId)) {
            $metaUrl = "https://graph.facebook.com/v20.0/{$this->phoneId}/messages";
            
            $payload = [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $cleanPhone,
                'type' => 'text',
                'text' => [
                    'preview_url' => false,
                    'body' => $message
                ]
            ];

            $ch = curl_init($metaUrl);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $this->token,
                    'Content-Type: application/json'
                ],
                CURLOPT_POSTFIELDS => json_encode($payload)
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            $logLine = sprintf(
                "[%s] META CLOUD API SENT TO +%s (HTTP %d):\nPayload: %s\nResponse: %s\n-----------------------------------\n",
                date('Y-m-d H:i:s'),
                $cleanPhone,
                $httpCode,
                json_encode($payload, JSON_UNESCAPED_UNICODE),
                $response ?: $curlError
            );
            file_put_contents($logFile, $logLine, FILE_APPEND);

            if ($httpCode >= 200 && $httpCode < 300) {
                return [
                    'success' => true,
                    'message' => 'Notification WhatsApp envoyée en réél via Meta Cloud API !',
                    'metaResponse' => json_decode($response, true)
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Erreur Meta WhatsApp Cloud API (Code ' . $httpCode . ')',
                    'errorDetails' => json_decode($response, true) ?? $curlError
                ];
            }
        }

        // Fallback: Local simulation log mode when token is empty
        $logLine = sprintf(
            "[%s] SIMULATED WHATSAPP SENT TO +%s:\n%s\n-----------------------------------\n",
            date('Y-m-d H:i:s'),
            $cleanPhone,
            $message
        );
        file_put_contents($logFile, $logLine, FILE_APPEND);

        return [
            'success' => true,
            'message' => 'Notification WhatsApp journalisée localement (Ajoutez votre WHATSAPP_TOKEN Meta dans .env pour l\'envoi réel).',
            'phone' => '+' . $cleanPhone,
            'content' => $message,
            'logFile' => 'var/log/whatsapp_notifications.log'
        ];
    }
}
