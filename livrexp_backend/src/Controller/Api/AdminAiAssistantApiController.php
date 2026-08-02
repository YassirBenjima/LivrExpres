<?php

namespace App\Controller\Api;

use App\Entity\Colis;
use App\Entity\PickupRequest;
use App\Entity\User;
use App\Repository\ColisRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/ai-assistant')]
final class AdminAiAssistantApiController extends AbstractController
{
    #[Route('/recent-parcels', name: 'api_admin_ai_recent_parcels', methods: ['GET'])]
    public function getRecentParcels(ColisRepository $colisRepository): JsonResponse
    {
        $colisList = $colisRepository->findBy([], ['id' => 'DESC'], 5);
        $result = [];

        foreach ($colisList as $colis) {
            $result[] = $this->formatColisData($colis);
        }

        return $this->json([
            'success' => true,
            'parcels' => $result,
        ]);
    }

    #[Route('/query', name: 'api_admin_ai_query', methods: ['POST'])]
    public function processQuery(
        Request $request,
        ColisRepository $colisRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $rawMessage = trim($data['message'] ?? '');
        $contextCode = trim($data['currentTrackingCode'] ?? '');

        if (empty($rawMessage) && empty($contextCode)) {
            return $this->json([
                'success' => false,
                'message' => 'Veuillez saisir un code de suivi (ex: CMD-84920) ou poser une question.',
            ]);
        }

        // --- Check for Ramassage Intent (single or multiple tracking codes) ---
        // Covers: ramassage, ramasage (typo), ramsage (typo), ramasser, dmd de ramassage, dem de ramasage, etc.
        $isRamassageIntent = (bool) preg_match('/\b(ramas{1,2}age|ramasser|ramsage|ramasage)\b/ui', $rawMessage)
            || (bool) preg_match('/\b(dmd|dem|demande)\b.*\b(ramas{1,2}age|ramsage|pickup)\b/ui', $rawMessage)
            || (bool) preg_match('/\bpickup\b/ui', $rawMessage);
        if ($isRamassageIntent) {
            // Extract full tracking codes first (CMD-XXXX or F-YYYYMMDD-NNNNNN), then bare numbers
            preg_match_all('/\b(CMD-\d+|F-\d{6,8}-\d+)\b/i', $rawMessage, $fullCodeMatches);
            $codes = array_values(array_unique(array_filter($fullCodeMatches[1] ?? [])));
            // Only fall back to bare numbers if no full codes were found
            if (empty($codes)) {
                preg_match_all('/\b(\d{4,8})\b/', $rawMessage, $bareMatches);
                $codes = array_values(array_unique(array_filter($bareMatches[1] ?? [])));
            }
            if (empty($codes) && !empty($contextCode)) {
                $codes = [$contextCode];
            }

            if (!empty($codes)) {
                $results = [];
                $updatedColis = null;

                foreach ($codes as $codeStr) {
                    $c = $this->findColisByCode($codeStr, $colisRepository);
                    if (!$c) {
                        $results[] = sprintf("❌ **%s** : Colis introuvable dans la base de données.", $codeStr);
                        continue;
                    }

                    $updatedColis = $c;
                    // Block ramassage for already-completed or delivered/returned parcels
                    $finalEtats = [Colis::ETAT_LIVRE, Colis::ETAT_RETOUR];
                    if (in_array($c->getEtat(), $finalEtats) || $c->getStatut() === Colis::STATUT_TERMINE) {
                        $results[] = sprintf(
                            "🚫 **%s** : Impossible de créer une demande de ramassage. Ce colis est déjà dans un état final (État: **%s** | Statut: **%s**). Aucune action n'est requise.",
                            $c->getOrderNumber(),
                            $c->getEtat() ?? '-',
                            $c->getStatut() ?? '-'
                        );
                    } elseif ($c->getEtat() === Colis::ETAT_EN_PREPARATION || $c->getStatut() === Colis::STATUT_EN_COURS) {
                        $results[] = sprintf("⚠️ **%s** : Ce colis fait DÉJÀ l'objet d'une demande de ramassage (État: En préparation | Statut: %s).", $c->getOrderNumber(), $c->getStatut() ?? 'En cours');
                    } else {
                        $c->setEtat(Colis::ETAT_EN_PREPARATION);
                        $c->setStatut(Colis::STATUT_EN_COURS);

                        // Automatically create PickupRequest so it appears in /ramassage list
                        $user = $this->getUser();
                        $pickupRequest = new PickupRequest();
                        $pickupRequest->setProductNameSnapshot($c->getProductNature() ?: $c->getOrderNumber());
                        $pickupRequest->setCity($c->getCity() ?: 'Casablanca');
                        $pickupRequest->setNeighborhood('Centre');
                        $pickupRequest->setAddress($c->getAddress() ?: 'Adresse client/fournisseur');
                        $pickupRequest->setPhone($c->getPhoneNumber() ?: '0600000000');
                        $pickupRequest->setNote(sprintf('Ramassage colis %s', $c->getOrderNumber()));
                        $pickupRequest->setHasLabels(true);
                        $pickupRequest->setStatus('pending');
                        $pickupRequest->setType($c->getType() === Colis::TYPE_STOCK ? 'stock' : 'simple');
                        if ($user instanceof User) {
                            $pickupRequest->setCreatedBy($user);
                        }

                        $entityManager->persist($pickupRequest);
                        $results[] = sprintf("✅ **%s** : Demande de ramassage enregistrée avec succès !", $c->getOrderNumber());
                    }
                }

                $entityManager->flush();

                return $this->json([
                    'success' => true,
                    'message' => "🤖 **IA Agent Logistique - Demandes de Ramassage** :\n\n" . implode("\n\n", $results),
                    'colis' => $updatedColis ? $this->formatColisData($updatedColis) : null
                ]);
            }
        }

        // 1. Extract tracking code or order number from raw message or context
        $extractedCode = $this->extractTrackingCode($rawMessage) ?: $contextCode;

        $colis = null;
        if (!empty($extractedCode)) {
            $colis = $this->findColisByCode($extractedCode, $colisRepository);
        }

        // If no parcel found and user specified one that doesn't exist
        if (!$colis) {
            if (!empty($extractedCode)) {
                return $this->json([
                    'success' => false,
                    'message' => sprintf("⚠️ **IA Assistant** : Aucun colis trouvé pour la référence **%s** dans la base de données. Veuillez vérifier le code de suivi.", $extractedCode),
                ]);
            }
            return $this->json([
                'success' => true,
                'intent' => 'NEED_CODE',
                'message' => "🤖 **Assistant IA Super Admin** : Quel est le code de suivi (ex: `CMD-84920`) du colis que vous souhaitez inspecter ou modifier ?",
            ]);
        }

        $parcelContext = $this->formatColisData($colis);

        // 2. Attempt Generative AI Call (Gemini API LLM) if API key is present
        $llmResult = $this->callGeminiLlm($rawMessage, $parcelContext);

        $changesMade = [];
        $aiReply = "";

        if ($llmResult && isset($llmResult['aiReply'])) {
            // Apply updates suggested by Gemini LLM
            $updates = $llmResult['updates'] ?? [];
            
            if (!empty($updates['etat']) && in_array($updates['etat'], Colis::getEtatsPossibles())) {
                $old = $colis->getEtat();
                $colis->setEtat($updates['etat']);
                $changesMade[] = sprintf("État: `%s` ➔ **%s**", $old, $updates['etat']);
            }
            if (!empty($updates['statut']) && in_array($updates['statut'], Colis::getStatutsPossibles())) {
                $old = $colis->getStatut();
                $colis->setStatut($updates['statut']);
                $changesMade[] = sprintf("Statut: `%s` ➔ **%s**", $old, $updates['statut']);
            }
            if (!empty($updates['city'])) {
                $old = $colis->getCity();
                $colis->setCity(ucfirst($updates['city']));
                $changesMade[] = sprintf("Ville: `%s` ➔ **%s**", $old, ucfirst($updates['city']));
            }
            if (!empty($updates['price']) && is_numeric($updates['price'])) {
                $old = $colis->getPrice();
                $colis->setPrice((string)$updates['price']);
                $changesMade[] = sprintf("Prix: `%s DH` ➔ **%.2f DH**", $old, (float)$updates['price']);
            }
            if (!empty($updates['recipient'])) {
                $old = $colis->getRecipient();
                $colis->setRecipient(ucwords($updates['recipient']));
                $changesMade[] = sprintf("Destinataire: `%s` ➔ **%s**", $old, ucwords($updates['recipient']));
            }
            if (!empty($updates['phoneNumber'])) {
                $old = $colis->getPhoneNumber();
                $colis->setPhoneNumber($updates['phoneNumber']);
                $changesMade[] = sprintf("Tél: `%s` ➔ **%s**", $old, $updates['phoneNumber']);
            }

            $aiReply = "🤖 **Intelligence Artificielle (Gemini)** :\n" . $llmResult['aiReply'];
        } else {
            // Fallback Autonomous AI Engine (NLU Intent Processor)
            $aiEngine = $this->runAutonomousAiEngine($rawMessage, $colis);
            $changesMade = $aiEngine['changes'];
            $aiReply = $aiEngine['reply'];
        }

        // Save changes if updates occurred
        if (!empty($changesMade)) {
            $entityManager->flush();
            $aiReply .= "\n\n✨ **Changements enregistrés en BDD :**\n" . implode("\n", $changesMade);
        }

        return $this->json([
            'success' => true,
            'message' => $aiReply,
            'colis' => $this->formatColisData($colis),
            'changes' => $changesMade,
            'availableEtats' => Colis::getEtatsPossibles(),
            'availableStatuts' => Colis::getStatutsPossibles(),
            'llmEngine' => $llmResult ? 'Gemini Generative AI 1.5' : 'Autonomous AI Logistics Agent',
        ]);
    }

    #[Route('/update', name: 'api_admin_ai_update', methods: ['PUT', 'POST'])]
    public function directUpdate(
        Request $request,
        ColisRepository $colisRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $trackingCode = trim($data['trackingCode'] ?? $data['orderNumber'] ?? '');

        if (empty($trackingCode)) {
            return $this->json(['success' => false, 'message' => 'Code de suivi manquant.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $colis = $this->findColisByCode($trackingCode, $colisRepository);
        if (!$colis) {
            return $this->json(['success' => false, 'message' => 'Colis introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }

        if (isset($data['etat'])) {
            $colis->setEtat($data['etat']);
        }
        if (isset($data['statut'])) {
            $colis->setStatut($data['statut']);
        }
        if (isset($data['city'])) {
            $colis->setCity($data['city']);
        }
        if (isset($data['recipient'])) {
            $colis->setRecipient($data['recipient']);
        }
        if (isset($data['phoneNumber'])) {
            $colis->setPhoneNumber($data['phoneNumber']);
        }
        if (isset($data['address'])) {
            $colis->setAddress($data['address']);
        }
        if (isset($data['price'])) {
            $colis->setPrice((string)$data['price']);
        }

        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => sprintf("🤖 **IA Agent** : Le colis **%s** a été mis à jour avec succès dans la base de données !", $colis->getOrderNumber()),
            'colis' => $this->formatColisData($colis),
        ]);
    }

    /**
     * Calls Gemini 1.5 / 2.0 Generative AI API if GEMINI_API_KEY is defined
     */
    private function callGeminiLlm(string $prompt, array $parcelContext): ?array
    {
        $apiKey = $_ENV['GEMINI_API_KEY'] ?? $_SERVER['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY') ?: null;

        if (!$apiKey) {
            return null;
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;

        $systemInstruction = "You are LivrExpress Super Admin AI, an advanced logistics AI assistant.
Analyze user prompt, understand user intent, and determine if any parcel fields should be updated.
Output MUST be a valid JSON object matching this schema ONLY:
{
  \"aiReply\": \"Friendly professional response in French explaining the current status or actions taken\",
  \"updates\": {
     \"etat\": \"Créé\" | \"En préparation\" | \"Expédié\" | \"Livré\" | \"Retourné\" | null,
     \"statut\": \"En attente\" | \"En cours\" | \"Reporté\" | \"Échec\" | \"Terminé\" | null,
     \"city\": string | null,
     \"price\": float | null,
     \"recipient\": string | null,
     \"phoneNumber\": string | null
  }
}";

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $systemInstruction . "\n\nCurrent Parcel Data:\n" . json_encode($parcelContext) . "\n\nUser Message:\n" . $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.1,
                'responseMimeType' => 'application/json'
            ]
        ];

        try {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_CONNECTTIMEOUT => 2,
                CURLOPT_TIMEOUT => 3
            ]);

            $response = curl_exec($ch);
            curl_close($ch);

            if ($response) {
                $json = json_decode($response, true);
                $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if ($rawText) {
                    return json_decode($rawText, true);
                }
            }
        } catch (\Throwable $e) {
            // Fallback to internal AI engine on network/key error
        }

        return null;
    }

    /**
     * Internal Autonomous AI Agent Engine
     */
    private function runAutonomousAiEngine(string $rawMessage, Colis $colis): array
    {
        $changesMade = [];
        $previousEtat = $colis->getEtat();
        $previousStatut = $colis->getStatut();
        $messageLower = mb_strtolower($rawMessage);

        // --- Check for Etat changes ---
        if (preg_match('/(etat|état)\s*(vers|a|à|:|=)?\s*(livr[eé]|expedi[eé]|expédi[eé]|pr[eé]par|cr[eé]|retour)/u', $messageLower)
            || preg_match('/(passer|changer|mettre|modifi)\s*(l\'|\s)*(etat|état)/u', $messageLower)
            || preg_match('/\b(livr[eé]|expedi[eé]|expédi[eé]|retourn[eé])\b/u', $messageLower)) {

            if (str_contains($messageLower, 'livr')) {
                $colis->setEtat(Colis::ETAT_LIVRE);
                $changesMade[] = sprintf("État: `%s` ➔ **%s**", $previousEtat, Colis::ETAT_LIVRE);
            } elseif (str_contains($messageLower, 'expedi') || str_contains($messageLower, 'expédi')) {
                $colis->setEtat(Colis::ETAT_EXPEDIE);
                $changesMade[] = sprintf("État: `%s` ➔ **%s**", $previousEtat, Colis::ETAT_EXPEDIE);
            } elseif (str_contains($messageLower, 'prepar') || str_contains($messageLower, 'prépar')) {
                $colis->setEtat(Colis::ETAT_EN_PREPARATION);
                $changesMade[] = sprintf("État: `%s` ➔ **%s**", $previousEtat, Colis::ETAT_EN_PREPARATION);
            } elseif (str_contains($messageLower, 'cree') || str_contains($messageLower, 'créé')) {
                $colis->setEtat(Colis::ETAT_CREE);
                $changesMade[] = sprintf("État: `%s` ➔ **%s**", $previousEtat, Colis::ETAT_CREE);
            } elseif (str_contains($messageLower, 'retour')) {
                $colis->setEtat(Colis::ETAT_RETOUR);
                $changesMade[] = sprintf("État: `%s` ➔ **%s**", $previousEtat, Colis::ETAT_RETOUR);
            }
        }

        // --- Check for Statut changes ---
        if (preg_match('/(statut|status)\s*(vers|a|à|:|=)?\s*(termin[eé]|cours|attente|report[eé]|[eé]chec)/u', $messageLower)
            || preg_match('/(passer|changer|mettre|modifi)\s*(le|\s)*(statut|status)/u', $messageLower)
            || preg_match('/\b(termin[eé]|en cours|en attente|report[eé]|[eé]chec)\b/u', $messageLower)) {

            if (str_contains($messageLower, 'termin')) {
                $colis->setStatut(Colis::STATUT_TERMINE);
                $changesMade[] = sprintf("Statut: `%s` ➔ **%s**", $previousStatut, Colis::STATUT_TERMINE);
            } elseif (str_contains($messageLower, 'cours')) {
                $colis->setStatut(Colis::STATUT_EN_COURS);
                $changesMade[] = sprintf("Statut: `%s` ➔ **%s**", $previousStatut, Colis::STATUT_EN_COURS);
            } elseif (str_contains($messageLower, 'attente')) {
                $colis->setStatut(Colis::STATUT_EN_ATTENTE);
                $changesMade[] = sprintf("Statut: `%s` ➔ **%s**", $previousStatut, Colis::STATUT_EN_ATTENTE);
            } elseif (str_contains($messageLower, 'report')) {
                $colis->setStatut(Colis::STATUT_REPORTE);
                $changesMade[] = sprintf("Statut: `%s` ➔ **%s**", $previousStatut, Colis::STATUT_REPORTE);
            } elseif (str_contains($messageLower, 'echec') || str_contains($messageLower, 'échec')) {
                $colis->setStatut(Colis::STATUT_ECHEC);
                $changesMade[] = sprintf("Statut: `%s` ➔ **%s**", $previousStatut, Colis::STATUT_ECHEC);
            }
        }

        // --- Check for City change ---
        if (preg_match('/\b(?:par|vers|en|à|a|:|=)\s+([a-zA-ZÀ-ÿ-]+)/ui', $rawMessage, $matches)
            || preg_match('/ville\s+(?:de\s+)?([a-zA-ZÀ-ÿ-]+)/ui', $rawMessage, $matches)
            || preg_match('/ville\s*:\s*([a-zA-ZÀ-ÿ-]+)/ui', $rawMessage, $matches)) {
            $candidateCity = trim($matches[1]);
            $stopwords = ['vers', 'par', 'du', 'de', 'la', 'le', 'cette', 'commande', 'colis', 'et', 'etat', 'statut', 'changer'];
            if (!empty($candidateCity) && !in_array(strtolower($candidateCity), $stopwords)) {
                $oldCity = $colis->getCity();
                $formattedCity = ucfirst(strtolower($candidateCity));
                $colis->setCity($formattedCity);
                $changesMade[] = sprintf("Ville: `%s` ➔ **%s**", $oldCity, $formattedCity);
            }
        }

        // --- Check for Price change ---
        if (preg_match('/(prix|montant)\s*(vers|a|à|:|=)?\s*(\d+(?:\.\d+)?)/u', $rawMessage, $matches)) {
            $newPrice = (float) $matches[3];
            $oldPrice = $colis->getPrice();
            $colis->setPrice((string) $newPrice);
            $changesMade[] = sprintf("Prix: `%s DH` ➔ **%.2f DH**", $oldPrice, $newPrice);
        }

        // --- Check for Recipient change ---
        if (preg_match('/destinataire\s*(vers|a|à|:|=)?\s*([a-zA-ZÀ-ÿ\s-]+)/u', $rawMessage, $matches)) {
            $newRecipient = trim($matches[2]);
            if (!empty($newRecipient)) {
                $oldRecipient = $colis->getRecipient();
                $colis->setRecipient(ucwords($newRecipient));
                $changesMade[] = sprintf("Destinataire: `%s` ➔ **%s**", $oldRecipient, ucwords($newRecipient));
            }
        }

        if (!empty($changesMade)) {
            $reply = "🤖 **IA Agent Logistique** : J'ai analysé votre demande et appliqué les modifications à la commande **" . $colis->getOrderNumber() . "**.";
        } else {
            $reply = sprintf(
                "🤖 **IA Agent Logistique** : Voici la fiche et le suivi du colis **%s** :",
                $colis->getOrderNumber()
            );
        }

        return [
            'reply' => $reply,
            'changes' => $changesMade,
        ];
    }

    private function findColisByCode(string $code, ColisRepository $colisRepository): ?Colis
    {
        $cleanCode = strtoupper(trim($code));

        // Direct lookup by orderNumber or trackingCode (handles CMD-XXXX and F-YYYYMMDD-NNNNNN as-is)
        $colis = $colisRepository->findOneBy(['orderNumber' => $cleanCode])
            ?? $colisRepository->findOneBy(['trackingCode' => $cleanCode]);

        if ($colis) {
            return $colis;
        }

        // For F-YYYYMMDD-NNNNNN format: extract the LAST numeric segment → CMD-NNNNNN
        if (preg_match('/^F-\d{6,8}-(\d+)$/i', $cleanCode, $fMatches)) {
            $lastSegment = $fMatches[1];
            $colis = $colisRepository->findOneBy(['orderNumber' => 'CMD-' . $lastSegment]);
            if ($colis) {
                return $colis;
            }
        }

        // For bare numbers or CMD-XXXX: strip all non-digits and try CMD-digits
        $digits = preg_replace('/\D+/', '', $cleanCode);
        if (!empty($digits)) {
            $cmdCode = 'CMD-' . $digits;
            $colis = $colisRepository->findOneBy(['orderNumber' => $cmdCode]);
            if ($colis) {
                return $colis;
            }

            $colis = $colisRepository->find((int) $digits);
            if ($colis) {
                return $colis;
            }
        }

        return null;
    }

    private function extractTrackingCode(string $text): ?string
    {
        if (preg_match('/(CMD-\d+|F-\d+-\d+)/i', $text, $matches)) {
            return strtoupper($matches[1]);
        }

        if (preg_match('/\b\d{4,8}\b/', $text, $matches)) {
            return 'CMD-' . $matches[0];
        }

        return null;
    }

    private function formatColisData(Colis $colis): array
    {
        return [
            'id' => $colis->getId(),
            'orderNumber' => $colis->getOrderNumber() ?? ('CMD-' . $colis->getId()),
            'trackingCode' => $colis->getTrackingCode() ?? ('F-' . $colis->getId()),
            'recipient' => $colis->getRecipient() ?? 'Inconnu',
            'phoneNumber' => $colis->getPhoneNumber() ?? '-',
            'city' => $colis->getCity() ?? '-',
            'address' => $colis->getAddress() ?? '-',
            'price' => (float) ($colis->getPrice() ?? 0.0),
            'etat' => $colis->getEtat() ?? 'Créé',
            'statut' => $colis->getStatut() ?? 'En attente',
            'createdAt' => $colis->getCreatedAt() ? $colis->getCreatedAt()->format('d/m/Y H:i') : '',
            'productNature' => $colis->getProductNature() ?? 'Marchandise',
        ];
    }
}
