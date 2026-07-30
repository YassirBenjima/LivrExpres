<?php

namespace App\Controller\Api;

use App\Entity\Colis;
use App\Entity\WhatsAppTemplate;
use App\Repository\CityRepository;
use App\Repository\ColisRepository;
use App\Repository\WhatsAppTemplateRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_CLIENT')]
#[Route('/api/suivi')]
final class TrackingApiController extends AbstractController
{
    #[Route('/changement-destinataire', name: 'api_suivi_changement_destinataire', methods: ['GET'])]
    public function getChangementDestinataire(
        Request $request,
        ColisRepository $colisRepository,
        CityRepository $cityRepository,
    ): JsonResponse {
        $tab = (string) $request->query->get('tab', 'same');
        $search = trim((string) $request->query->get('q', ''));
        $selectedCity = trim((string) $request->query->get('city', ''));

        $user = $this->getUser();
        $qb = $colisRepository->createQueryBuilder('c')->orderBy('c.id', 'DESC');
        if (!$this->isGranted('ROLE_SUPERVISEUR') && $user instanceof User) {
            $qb->andWhere('c.createdBy = :user OR c.createdBy IS NULL')
               ->setParameter('user', $user);
        }
        $colisEntities = $qb->getQuery()->getResult();
        $colisList = [];

        $searchLower = mb_strtolower($search);
        $selectedCityLower = mb_strtolower($selectedCity);

        foreach ($colisEntities as $colis) {
            $colisCity = (string) $colis->getCity();
            if ($selectedCityLower !== '' && mb_strtolower($colisCity) !== $selectedCityLower) {
                continue;
            }

            if ($searchLower !== '') {
                $haystack = mb_strtolower(implode(' ', [
                    (string) $colis->getTrackingCode(),
                    (string) $colis->getOrderNumber(),
                    (string) $colis->getProductNature(),
                    $colisCity,
                    (string) $colis->getAddress(),
                    (string) $colis->getRecipient(),
                    (string) $colis->getPhoneNumber(),
                    (string) $colis->getComment(),
                    (string) $colis->getStatut(),
                    (string) $colis->getEtat(),
                ]));

                if (!str_contains($haystack, $searchLower)) {
                    continue;
                }
            }

            $statut = $colis->getStatut() ?? Colis::STATUT_EN_ATTENTE;
            $colisList[] = [
                'id' => $colis->getId(),
                'orderNumber' => $colis->getOrderNumber(),
                'trackingCode' => $colis->getTrackingCode(),
                'productNature' => $colis->getProductNature() ?: 'Marchandise',
                'createdAt' => $colis->getCreatedAt() ? $colis->getCreatedAt()->format('d/m/Y H:i') : '',
                'recipient' => $colis->getRecipient() ?: '',
                'phoneNumber' => $colis->getPhoneNumber() ?: '',
                'city' => $colisCity ?: '-',
                'address' => $colis->getAddress() ?: '-',
                'neighborhood' => $colis->getNeighborhood() ?: '',
                'price' => (float) ($colis->getPrice() ?? 0.0),
                'statut' => $statut,
                'statutLabel' => $statut,
                'etat' => $colis->getEtat() ?? Colis::ETAT_CREE,
                'comment' => $colis->getComment() ?: '-',
            ];
        }

        $cities = [];
        foreach ($cityRepository->findBy([], ['name' => 'ASC']) as $city) {
            $cities[] = (string) $city->getName();
        }

        return $this->json([
            'colis_list' => $colisList,
            'cities' => array_values(array_unique($cities)),
        ]);
    }

    #[Route('/changement-destinataire/bulk', name: 'api_suivi_changement_destinataire_bulk', methods: ['POST'])]
    public function bulkChangeRecipient(
        Request $request,
        ColisRepository $colisRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $ids = $data['colis_ids'] ?? [];

        if (!is_array($ids) || count($ids) === 0) {
            return $this->json(['message' => 'Aucun colis sélectionné.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $recipient = trim((string) ($data['recipient'] ?? ''));
        $phoneNumber = trim((string) ($data['phoneNumber'] ?? ''));
        $city = trim((string) ($data['city'] ?? ''));
        $address = trim((string) ($data['address'] ?? ''));
        $neighborhood = trim((string) ($data['neighborhood'] ?? ''));

        if ($recipient === '' && $phoneNumber === '' && $city === '' && $address === '' && $neighborhood === '') {
            return $this->json(['message' => 'Veuillez renseigner au moins un champ à modifier.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $updated = 0;
        foreach ($ids as $id) {
            $colis = $colisRepository->find((int) $id);
            if (!$colis) {
                continue;
            }

            if ($recipient !== '') {
                $colis->setRecipient($recipient);
            }
            if ($phoneNumber !== '') {
                $colis->setPhoneNumber($phoneNumber);
            }
            if ($city !== '') {
                $colis->setCity($city);
            }
            if ($address !== '') {
                $colis->setAddress($address);
            }
            if ($neighborhood !== '') {
                $colis->setNeighborhood($neighborhood);
            }

            ++$updated;
        }

        if ($updated > 0) {
            $entityManager->flush();
            return $this->json(['message' => sprintf('%d colis mis à jour avec succès.', $updated)]);
        }

        return $this->json(['message' => 'Aucun colis trouvé à mettre à jour.'], JsonResponse::HTTP_NOT_FOUND);
    }

    #[Route('/modele-whatsapp', name: 'api_suivi_modele_whatsapp_list', methods: ['GET'])]
    public function getWhatsappTemplates(
        Request $request,
        WhatsAppTemplateRepository $repository,
    ): JsonResponse {
        $search = trim((string) $request->query->get('q', ''));
        $status = trim((string) $request->query->get('status', ''));

        $templates = $repository->findForIndex($search, $status);
        $result = [];

        foreach ($templates as $template) {
            $result[] = [
                'id' => $template->getId(),
                'title' => $template->getTitle(),
                'message' => $template->getMessage(),
                'status' => $template->getStatus(),
                'isDefault' => $template->isDefault(),
                'createdAt' => $template->getCreatedAt() ? $template->getCreatedAt()->format('d/m/Y H:i') : null,
            ];
        }

        return $this->json(['templates' => $result]);
    }

    #[Route('/modele-whatsapp', name: 'api_suivi_modele_whatsapp_create', methods: ['POST'])]
    public function createWhatsappTemplate(
        Request $request,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $title = trim((string) ($data['title'] ?? ''));
        $message = trim((string) ($data['message'] ?? ''));

        if ($title === '' || $message === '') {
            return $this->json(['message' => 'Le titre et le message sont requis.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $template = new WhatsAppTemplate();
        $template->setTitle($title);
        $template->setMessage($message);
        $template->setStatus(WhatsAppTemplate::STATUS_ACTIVE);
        $template->setCreatedAt(new \DateTimeImmutable());

        $entityManager->persist($template);
        $entityManager->flush();

        return $this->json(['message' => 'Modèle WhatsApp créé avec succès.', 'id' => $template->getId()]);
    }

    #[Route('/modele-whatsapp/{id}', name: 'api_suivi_modele_whatsapp_update', methods: ['PUT'])]
    public function updateWhatsappTemplate(
        int $id,
        Request $request,
        WhatsAppTemplateRepository $repository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $template = $repository->find($id);
        if (!$template) {
            return $this->json(['message' => 'Modèle introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }
        if ($template->isDefault()) {
            return $this->json(['message' => 'Le modèle par défaut ne peut pas être modifié.'], JsonResponse::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $title = trim((string) ($data['title'] ?? ''));
        $message = trim((string) ($data['message'] ?? ''));

        if ($title === '' || $message === '') {
            return $this->json(['message' => 'Le titre et le message sont requis.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $template->setTitle($title);
        $template->setMessage($message);
        $entityManager->flush();

        return $this->json(['message' => 'Modèle WhatsApp mis à jour avec succès.']);
    }

    #[Route('/modele-whatsapp/{id}/status', name: 'api_suivi_modele_whatsapp_toggle_status', methods: ['POST'])]
    public function toggleWhatsappTemplateStatus(
        int $id,
        WhatsAppTemplateRepository $repository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $template = $repository->find($id);
        if (!$template) {
            return $this->json(['message' => 'Modèle introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }
        if ($template->isDefault()) {
            return $this->json(['message' => 'Le modèle par défaut ne peut pas changer de statut.'], JsonResponse::HTTP_FORBIDDEN);
        }

        $nextStatus = $template->getStatus() === WhatsAppTemplate::STATUS_ACTIVE
            ? WhatsAppTemplate::STATUS_INACTIVE
            : WhatsAppTemplate::STATUS_ACTIVE;

        $template->setStatus($nextStatus);
        $entityManager->flush();

        return $this->json(['message' => 'Statut du modèle mis à jour avec succès.', 'status' => $nextStatus]);
    }

    #[Route('/modele-whatsapp/{id}', name: 'api_suivi_modele_whatsapp_delete', methods: ['DELETE'])]
    public function deleteWhatsappTemplate(
        int $id,
        WhatsAppTemplateRepository $repository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $template = $repository->find($id);
        if (!$template) {
            return $this->json(['message' => 'Modèle introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }
        if ($template->isDefault()) {
            return $this->json(['message' => 'Le modèle par défaut ne peut pas être supprimé.'], JsonResponse::HTTP_FORBIDDEN);
        }

        $entityManager->remove($template);
        $entityManager->flush();

        return $this->json(['message' => 'Modèle WhatsApp supprimé avec succès.']);
    }
}
