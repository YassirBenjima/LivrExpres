<?php

namespace App\Controller\Api;

use App\Entity\Colis;
use App\Entity\PickupRequest;
use App\Entity\StockMovement;
use App\Entity\StockProduct;
use App\Entity\StockProductVariant;
use App\Entity\StockMovementItem;
use App\Repository\CityRepository;
use App\Repository\ColisRepository;
use App\Repository\PickupRequestRepository;
use App\Repository\StockProductRepository;
use App\Repository\StockMovementRepository;
use App\Repository\StockProductVariantRepository;
use App\Service\StockProductMediaManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class StockApiController extends AbstractController
{
    // ─────────────────────────────────────────────
    // PRODUCTS
    // ─────────────────────────────────────────────

    #[Route('/api/stock/products', name: 'api_stock_products_list', methods: ['GET'])]
    public function products(
        Request $request,
        StockProductRepository $repo,
        PickupRequestRepository $pickupRequestRepo
    ): JsonResponse {
        $search = trim((string) $request->query->get('q', ''));
        $all = $repo->findBy([], ['id' => 'DESC']);

        $productIds = array_values(array_filter(array_map(
            static fn(StockProduct $p): int => (int) $p->getId(),
            $all
        ), static fn(int $v): bool => $v > 0));
        $requestedIds = $pickupRequestRepo->findProductIdsWithPendingRequests($productIds);
        $requestedSet = array_fill_keys($requestedIds, true);

        $data = [];
        foreach ($all as $product) {
            if (!$product instanceof StockProduct) continue;

            if ($search !== '' && !str_contains(mb_strtolower($product->getName()), mb_strtolower($search))) {
                continue;
            }

            $totalQty = $product->getVariants()->count() > 0
                ? array_sum(array_map(fn(StockProductVariant $v): int => $v->getQuantity(), $product->getVariants()->toArray()))
                : (int) ($product->getQuantity() ?? 0);

            $variantsData = [];
            foreach ($product->getVariants() as $v) {
                if (!$v instanceof StockProductVariant) continue;
                $variantsData[] = [
                    'id'       => $v->getId(),
                    'name'     => $v->getName(),
                    'barcode'  => $v->getBarcode(),
                    'quantity' => $v->getQuantity(),
                ];
            }

            $data[] = [
                'id'               => $product->getId(),
                'name'             => $product->getName(),
                'photo_url'        => $product->getPhotoPath() ? '/' . ltrim($product->getPhotoPath(), '/') : null,
                'barcode'          => $product->getBarcode(),
                'category'         => $product->getCategory(),
                'note'             => $product->getNote(),
                'quantity'         => $totalQty,
                'variants'         => $variantsData,
                'pickup_requested' => isset($requestedSet[$product->getId()]),
                'updated_at'       => $product->getUpdatedAt() ? $product->getUpdatedAt()->format('d/m/Y H:i') : null,
            ];
        }

        return $this->json([
            'products'       => $data,
            'total_products' => count($data),
            'total_qty'      => array_sum(array_column($data, 'quantity')),
        ]);
    }

    #[Route('/api/stock/products', name: 'api_stock_products_create', methods: ['POST'])]
    public function createProduct(
        Request $request,
        EntityManagerInterface $em,
        StockProductVariantRepository $variantRepo,
        StockProductMediaManager $mediaManager
    ): JsonResponse {
        $name = trim((string) $request->request->get('name', ''));
        $category = trim((string) $request->request->get('category', ''));
        $variantsEnabled = (bool) $request->request->get('variants_enabled');
        $note = trim((string) $request->request->get('note', ''));

        // Category select submits numeric IDs (1..11)
        $allowedCategories = array_map('strval', range(1, 11));
        if ($name === '') {
            return $this->json(['message' => 'Le nom du produit est obligatoire.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        if ($category === '' || !\in_array($category, $allowedCategories, true)) {
            return $this->json(['message' => 'Veuillez choisir une catégorie valide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $product = new StockProduct($name, $category);
        $product->setNote($note !== '' ? $note : null);

        if ($variantsEnabled) {
            /** @var array<int, array{barcode?: mixed, name?: mixed, quantity?: mixed}> $variants */
            $variants = $request->request->all('variants');

            $hasAtLeastOne = false;
            foreach ($variants as $row) {
                $vName = trim((string) ($row['name'] ?? ''));
                $vBarcode = trim((string) ($row['barcode'] ?? ''));
                $vQtyRaw = (string) ($row['quantity'] ?? '');
                $vQty = $vQtyRaw !== '' ? (int) $vQtyRaw : null;

                if ($vName === '' && $vBarcode === '' && ($vQty === null || $vQty === 0)) {
                    continue;
                }

                $hasAtLeastOne = true;
                if ($vName === '') {
                    return $this->json(['message' => 'Chaque variante doit avoir un nom.'], JsonResponse::HTTP_BAD_REQUEST);
                }
                if ($vQty === null || $vQty < 0) {
                    return $this->json(['message' => 'La quantité de chaque variante est obligatoire et doit être valide.'], JsonResponse::HTTP_BAD_REQUEST);
                }

                $variant = new StockProductVariant($vName, $vQty);
                $variant->setBarcode($vBarcode !== '' ? $vBarcode : null);
                if ($variant->getBarcode() === null) {
                    $variant->setBarcode($this->generateUniqueBarcode($em, $variantRepo));
                }
                $product->addVariant($variant);
            }

            if (!$hasAtLeastOne) {
                return $this->json(['message' => 'Ajoutez au moins une variante ou désactivez le mode variantes.'], JsonResponse::HTTP_BAD_REQUEST);
            }

            // Ensure product also has its own barcode (mandatory)
            if ($product->getBarcode() === null) {
                $product->setBarcode($this->generateUniqueBarcode($em, $variantRepo));
            }
        } else {
            $barcodeVal = trim((string) $request->request->get('barcode', ''));
            $product->setBarcode($barcodeVal !== '' ? $barcodeVal : null);
            if ($product->getBarcode() === null) {
                $product->setBarcode($this->generateUniqueBarcode($em, $variantRepo));
            }

            $qtyRaw = trim((string) $request->request->get('quantity', ''));
            if ($qtyRaw === '' || !ctype_digit($qtyRaw)) {
                return $this->json(['message' => 'La quantité est obligatoire.'], JsonResponse::HTTP_BAD_REQUEST);
            }
            $product->setQuantity((int) $qtyRaw);
        }

        $photo = $request->files->get('photo');
        if ($photo instanceof UploadedFile) {
            if (!$photo->isValid()) {
                return $this->json(['message' => 'Le fichier image est invalide.'], JsonResponse::HTTP_BAD_REQUEST);
            }

            $mime = (string) $photo->getMimeType();
            if (!\in_array($mime, ['image/jpeg', 'image/png'], true)) {
                return $this->json(['message' => 'Format image non supporté. Utilisez JPG ou PNG.'], JsonResponse::HTTP_BAD_REQUEST);
            }
        }

        $em->persist($product);

        $newPhotoPath = null;
        $newQrPath = null;
        try {
            if ($photo instanceof UploadedFile) {
                $newPhotoPath = $mediaManager->uploadProductPhoto($photo);
                $product->setPhotoPath($newPhotoPath);
            }

            // QR code is generated at creation time (mandatory)
            $barcodeForQr = $product->getBarcode();
            if ($barcodeForQr !== null) {
                $newQrPath = $mediaManager->generateProductQrPng($barcodeForQr);
                $product->setQrCodePath($newQrPath);
            }

            $em->flush();
        } catch (\Throwable $e) {
            // Cleanup any new file created during this request to avoid orphans.
            $mediaManager->deletePublicFileSafely($newPhotoPath);
            $mediaManager->deletePublicFileSafely($newQrPath);

            return $this->json(['message' => 'Erreur lors de l’enregistrement du produit: ' . $e->getMessage()], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['message' => 'Produit créé avec succès.', 'id' => $product->getId()]);
    }

    #[Route('/api/stock/products/{id}', name: 'api_stock_products_show', methods: ['GET'])]
    public function getProduct(
        int $id,
        StockProductRepository $repo
    ): JsonResponse {
        $product = $repo->find($id);
        if (!$product instanceof StockProduct) {
            return $this->json(['message' => 'Produit introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }

        $totalQty = $product->getVariants()->count() > 0
            ? array_sum(array_map(fn(StockProductVariant $v): int => $v->getQuantity(), $product->getVariants()->toArray()))
            : (int) ($product->getQuantity() ?? 0);

        $variantsData = [];
        foreach ($product->getVariants() as $v) {
            if (!$v instanceof StockProductVariant) continue;
            $variantsData[] = [
                'id'       => $v->getId(),
                'name'     => $v->getName(),
                'barcode'  => $v->getBarcode(),
                'quantity' => $v->getQuantity(),
            ];
        }

        return $this->json([
            'id'               => $product->getId(),
            'name'             => $product->getName(),
            'photo_url'        => $product->getPhotoPath() ? '/' . ltrim($product->getPhotoPath(), '/') : null,
            'barcode'          => $product->getBarcode(),
            'category'         => $product->getCategory(),
            'note'             => $product->getNote(),
            'quantity'         => $product->getQuantity(),
            'total_quantity'   => $totalQty,
            'variants'         => $variantsData,
            'variants_enabled' => count($variantsData) > 0,
            'updated_at'       => $product->getUpdatedAt() ? $product->getUpdatedAt()->format('d/m/Y H:i') : null,
        ]);
    }

    #[Route('/api/stock/products/{id}', name: 'api_stock_products_update', methods: ['POST'])]
    public function updateProduct(
        int $id,
        Request $request,
        StockProductRepository $stockProductRepository,
        StockProductVariantRepository $stockProductVariantRepository,
        EntityManagerInterface $entityManager,
        StockProductMediaManager $mediaManager,
    ): JsonResponse {
        $product = $stockProductRepository->find($id);
        if (!$product instanceof StockProduct) {
            return $this->json(['message' => 'Produit introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }

        $name = trim((string) $request->request->get('name', ''));
        $category = trim((string) $request->request->get('category', ''));
        $variantsEnabled = (bool) $request->request->get('variants_enabled');
        $note = trim((string) $request->request->get('note', ''));

        $allowedCategories = array_map('strval', range(1, 11));
        if ($name === '') {
            return $this->json(['message' => 'Le nom du produit est obligatoire.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        if ($category === '' || !\in_array($category, $allowedCategories, true)) {
            return $this->json(['message' => 'Veuillez choisir une catégorie valide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $oldPhotoPath = $product->getPhotoPath();
        $oldQrPath = $product->getQrCodePath();

        $product->setName($name);
        $product->setCategory($category);
        $product->setNote($note !== '' ? $note : null);

        if ($variantsEnabled) {
            // Replace variants with submitted ones
            foreach ($product->getVariants()->toArray() as $existing) {
                if ($existing instanceof StockProductVariant) {
                    $product->removeVariant($existing);
                }
            }

            /** @var array<int, array{barcode?: mixed, name?: mixed, quantity?: mixed}> $variants */
            $variants = $request->request->all('variants');
            $hasAtLeastOne = false;
            foreach ($variants as $row) {
                $vName = trim((string) ($row['name'] ?? ''));
                $vBarcode = trim((string) ($row['barcode'] ?? ''));
                $vQtyRaw = (string) ($row['quantity'] ?? '');
                $vQty = $vQtyRaw !== '' ? (int) $vQtyRaw : null;

                if ($vName === '' && $vBarcode === '' && ($vQty === null || $vQty === 0)) {
                    continue;
                }

                $hasAtLeastOne = true;
                if ($vName === '' || $vQty === null || $vQty < 0) {
                    return $this->json(['message' => 'Chaque variante doit avoir un nom et une quantité valide.'], JsonResponse::HTTP_BAD_REQUEST);
                }

                $variant = new StockProductVariant($vName, $vQty);
                $variant->setBarcode($vBarcode !== '' ? $vBarcode : null);
                if ($variant->getBarcode() === null) {
                    $variant->setBarcode($this->generateUniqueBarcode($entityManager, $stockProductVariantRepository));
                }
                $product->addVariant($variant);
            }

            if (!$hasAtLeastOne) {
                return $this->json(['message' => 'Ajoutez au moins une variante ou désactivez le mode variantes.'], JsonResponse::HTTP_BAD_REQUEST);
            }

            if ($product->getBarcode() === null) {
                $product->setBarcode($this->generateUniqueBarcode($entityManager, $stockProductVariantRepository));
            }
            $product->setQuantity(null);
        } else {
            // No variants: keep quantity + barcode on product
            $barcodeVal = trim((string) $request->request->get('barcode', ''));
            $product->setBarcode($barcodeVal !== '' ? $barcodeVal : null);
            if ($product->getBarcode() === null) {
                $product->setBarcode($this->generateUniqueBarcode($entityManager, $stockProductVariantRepository));
            }

            $qtyRaw = trim((string) $request->request->get('quantity', ''));
            if ($qtyRaw === '' || !ctype_digit($qtyRaw)) {
                return $this->json(['message' => 'La quantité est obligatoire.'], JsonResponse::HTTP_BAD_REQUEST);
            }
            $product->setQuantity((int) $qtyRaw);
        }

        $photo = $request->files->get('photo');
        if ($photo instanceof UploadedFile) {
            if (!$photo->isValid()) {
                return $this->json(['message' => 'Le fichier image est invalide.'], JsonResponse::HTTP_BAD_REQUEST);
            }

            $mime = (string) $photo->getMimeType();
            if (!\in_array($mime, ['image/jpeg', 'image/png'], true)) {
                return $this->json(['message' => 'Format image non supporté. Utilisez JPG ou PNG.'], JsonResponse::HTTP_BAD_REQUEST);
            }
        }

        $photoRemove = (bool) $request->request->get('photo_remove');
        if ($photoRemove && !$photo) {
            $product->setPhotoPath(null);
        }

        $newPhotoPath = null;
        $newQrPath = null;
        try {
            if ($photo instanceof UploadedFile) {
                $newPhotoPath = $mediaManager->uploadProductPhoto($photo);
                $product->setPhotoPath($newPhotoPath);
            }

            // Always regenerate QR on every update
            $barcodeForQr = $product->getBarcode();
            if ($barcodeForQr !== null) {
                $newQrPath = $mediaManager->generateProductQrPng($barcodeForQr);
                $product->setQrCodePath($newQrPath);
            }

            $entityManager->flush();
        } catch (\Throwable $e) {
            $mediaManager->deletePublicFileSafely($newPhotoPath);
            $mediaManager->deletePublicFileSafely($newQrPath);

            return $this->json(['message' => 'Erreur lors de la modification du produit.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }

        // Delete replaced files after a successful flush
        if ($newPhotoPath !== null && $oldPhotoPath !== null && $oldPhotoPath !== $newPhotoPath) {
            $mediaManager->deletePublicFileSafely($oldPhotoPath);
        }
        if ($photoRemove && !$photo && $oldPhotoPath !== null) {
            $mediaManager->deletePublicFileSafely($oldPhotoPath);
        }
        if ($newQrPath !== null && $oldQrPath !== null && $oldQrPath !== $newQrPath) {
            $mediaManager->deletePublicFileSafely($oldQrPath);
        }

        return $this->json(['message' => 'Produit modifié avec succès.']);
    }

    #[Route('/api/stock/products/{id}', name: 'api_stock_products_delete', methods: ['DELETE'])]
    public function deleteProduct(
        int $id,
        StockProductRepository $stockProductRepository,
        EntityManagerInterface $entityManager,
        StockProductMediaManager $mediaManager,
    ): JsonResponse {
        $product = $stockProductRepository->find($id);
        if (!$product instanceof StockProduct) {
            return $this->json(['message' => 'Produit introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }

        // Check if there are any stock movements linked to the product's variants
        $movementItemRepo = $entityManager->getRepository(StockMovementItem::class);
        foreach ($product->getVariants() as $variant) {
            if ($movementItemRepo->count(['variant' => $variant]) > 0) {
                return $this->json([
                    'message' => 'Impossible de supprimer ce produit car il est lié à des mouvements de stock.'
                ], JsonResponse::HTTP_BAD_REQUEST);
            }
        }

        $oldPhotoPath = $product->getPhotoPath();
        $oldQrPath = $product->getQrCodePath();

        $entityManager->remove($product);
        try {
            $entityManager->flush();
        } catch (\Throwable $e) {
            return $this->json([
                'message' => 'Erreur lors de la suppression du produit.',
                'error' => $e->getMessage()
            ], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }

        // Best effort cleanup after DB success.
        $mediaManager->deletePublicFileSafely($oldPhotoPath);
        $mediaManager->deletePublicFileSafely($oldQrPath);

        return $this->json(['message' => 'Produit supprimé avec succès.']);
    }


    #[Route('/api/stock/products/{id}/pickup-request', name: 'api_stock_products_pickup_request_create', methods: ['POST'])]
    public function pickupRequestCreate(
        int $id,
        Request $request,
        StockProductRepository $stockProductRepository,
        PickupRequestRepository $pickupRequestRepository,
        CityRepository $cityRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $product = $stockProductRepository->find($id);
        if (!$product instanceof StockProduct) {
            return $this->json(['message' => 'Produit introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }

        $user = $this->getUser();
        if (!$user instanceof \App\Entity\User) {
            return $this->json(['message' => 'Vous devez être connecté pour effectuer cette action.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if ($pickupRequestRepository->hasPendingForProductId((int) $product->getId())) {
            return $this->json(['message' => 'Une demande de ramassage est déjà en attente pour ce produit.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        // Handle JSON or Form URL Encoded requests
        $data = json_decode($request->getContent(), true) ?? $request->request->all();

        $city = trim((string) ($data['city'] ?? ''));
        $neighborhood = trim((string) ($data['neighborhood'] ?? ''));
        $address = trim((string) ($data['address'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? ''));
        $supplierPhone = trim((string) ($data['supplier_phone'] ?? ''));
        $note = trim((string) ($data['note'] ?? ''));
        $hasLabelsRaw = (string) ($data['has_labels'] ?? '');

        if ($city === '') {
            return $this->json(['message' => 'La ville est obligatoire.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        if ($cityRepository->count(['name' => $city]) === 0) {
            return $this->json(['message' => 'Veuillez choisir une ville valide.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        if ($neighborhood === '') {
            return $this->json(['message' => 'Le quartier est obligatoire.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        if ($address === '') {
            return $this->json(['message' => 'L’adresse est obligatoire.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        if ($phone === '') {
            return $this->json(['message' => 'Le téléphone est obligatoire.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $hasLabels = ($hasLabelsRaw === '1' || $hasLabelsRaw === 'true' || $hasLabelsRaw === true);

        $pickupRequest = new PickupRequest();
        $pickupRequest->setProduct($product);
        $pickupRequest->setProductNameSnapshot($product->getName());
        $pickupRequest->setCity($city);
        $pickupRequest->setNeighborhood($neighborhood);
        $pickupRequest->setAddress($address);
        $pickupRequest->setPhone($phone);
        $pickupRequest->setSupplierPhone($supplierPhone !== '' ? $supplierPhone : null);
        $pickupRequest->setNote($note !== '' ? $note : null);
        $pickupRequest->setHasLabels($hasLabels);
        $pickupRequest->setCreatedBy($user);
        $pickupRequest->setStatus('pending');

        $entityManager->persist($pickupRequest);
        $entityManager->flush();

        return $this->json(['message' => 'Demande de ramassage enregistrée avec succès.']);
    }

    // ─────────────────────────────────────────────
    // STOCK ENTRY MOVEMENTS
    // ─────────────────────────────────────────────

    #[Route('/api/stock/entry', name: 'api_stock_entry_list', methods: ['GET'])]
    public function entryList(Request $request, StockMovementRepository $repo): JsonResponse
    {
        $search = trim((string) $request->query->get('q', ''));
        $movements = $repo->findEntryMovementsForIndex($search);

        $data = [];
        foreach ($movements as $m) {
            if (!$m instanceof StockMovement) continue;

            $products = [];
            foreach ($m->getItems() as $item) {
                $pName = $item->getVariant()?->getProduct()?->getName();
                if (is_string($pName) && $pName !== '') {
                    $products[] = $pName;
                }
            }
            $count = count($products);
            $summary = $count === 0 ? '-' : ($count <= 2 ? implode(', ', $products) : sprintf('%s, +%d', implode(', ', array_slice($products, 0, 2)), $count - 2));

            $data[] = [
                'id'               => $m->getId(),
                'reference'        => $m->getReference(),
                'products_summary' => $summary,
                'products_count'   => $count,
                'status'           => $m->getStatus(),
                'created_at'       => $m->getCreatedAt() ? $m->getCreatedAt()->format('d/m/Y H:i') : null,
                'updated_at'       => $m->getUpdatedAt() ? $m->getUpdatedAt()->format('d/m/Y H:i') : null,
            ];
        }

        return $this->json(['movements' => $data, 'total' => count($data)]);
    }

    #[Route('/api/stock/entry', name: 'api_stock_entry_save', methods: ['POST'])]
    public function entrySave(Request $request, EntityManagerInterface $em, StockMovementRepository $movRepo, StockProductVariantRepository $variantRepo): JsonResponse
    {
        $body = json_decode($request->getContent(), true);
        $variants = $body['variants'] ?? [];

        if (empty($variants)) {
            return $this->json(['message' => 'Veuillez saisir au moins une quantité.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $reference = $this->generateUniqueRef($movRepo);
        $movement = new StockMovement($reference);
        $movement->setDirection(StockMovement::DIRECTION_ENTRY);
        $movement->setStatus(StockMovement::STATUS_PENDING);
        $em->persist($movement);

        foreach ($variants as $variantId => $qty) {
            $qty = (int) $qty;
            if ($qty <= 0) continue;
            $variant = $variantRepo->find((int) $variantId);
            if ($variant instanceof StockProductVariant) {
                $movement->addItem(new StockMovementItem($variant, $qty));
            }
        }

        if ($movement->getItems()->count() === 0) {
            return $this->json(['message' => 'Aucune variante valide sélectionnée.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $em->flush();

        return $this->json(['message' => 'Mouvement de stock enregistré avec succès.', 'id' => $movement->getId()]);
    }

    // ─────────────────────────────────────────────
    // STOCK COLIS (pickup)
    // ─────────────────────────────────────────────

    #[Route('/api/stock/colis', name: 'api_stock_colis_list', methods: ['GET'])]
    public function stockColis(ColisRepository $repo): JsonResponse
    {
        $colisList = $repo->findBy([
            'statut' => Colis::STATUT_EN_ATTENTE,
            'type'   => Colis::TYPE_STOCK,
        ], ['id' => 'DESC']);

        $data = [];
        foreach ($colisList as $colis) {
            $etat   = $colis->getEtat()   ?? Colis::ETAT_CREE;
            $statut = $colis->getStatut() ?? Colis::STATUT_EN_ATTENTE;

            $data[] = [
                'id'           => $colis->getId(),
                'orderNumber'  => $colis->getOrderNumber(),
                'trackingCode' => $colis->getTrackingCode(),
                'productNature'=> $colis->getProductNature() ?: 'Marchandise',
                'createdAt'    => $colis->getCreatedAt() ? $colis->getCreatedAt()->format('d/m/Y H:i') : '',
                'address'      => $colis->getAddress() ?: '-',
                'city'         => $colis->getCity() ?: '-',
                'price'        => (float) ($colis->getPrice() ?? 0.0),
                'etatLabel'    => $etat,
                'etatBadgeClass' => match ($etat) {
                    Colis::ETAT_LIVRE         => 'kt-badge-success',
                    Colis::ETAT_EN_PREPARATION => 'kt-badge-warning',
                    Colis::ETAT_EXPEDIE        => 'kt-badge-info',
                    Colis::ETAT_RETOUR         => 'kt-badge-destructive',
                    default                    => 'kt-badge-primary',
                },
                'statutLabel'  => $statut,
                'statutBadgeClass' => match ($statut) {
                    Colis::STATUT_TERMINE => 'kt-badge-success',
                    Colis::STATUT_REPORTE => 'kt-badge-warning',
                    Colis::STATUT_ECHEC   => 'kt-badge-destructive',
                    default               => 'kt-badge-primary',
                },
                'comment'      => $colis->getComment() ?: '-',
            ];
        }

        return $this->json($data);
    }

    // ─────────────────────────────────────────────
    // HELPER
    // ─────────────────────────────────────────────

    private function generateUniqueRef(StockMovementRepository $repo): string
    {
        do {
            $ref = 'ENT-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        } while ($repo->findOneBy(['reference' => $ref]) !== null);

        return $ref;
    }

    private function generateUniqueBarcode(
        EntityManagerInterface $entityManager,
        StockProductVariantRepository $stockProductVariantRepository,
    ): string {
        $alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        $maxAttempts = 25;

        for ($i = 0; $i < $maxAttempts; $i++) {
            $code = '';
            $alphaLen = strlen($alphabet);
            for ($j = 0; $j < 8; $j++) {
                $code .= $alphabet[random_int(0, $alphaLen - 1)];
            }

            // uniqueness against both product.barcode and variant.barcode
            $existsInVariants = $stockProductVariantRepository->count(['barcode' => $code]) > 0;
            if ($existsInVariants) {
                continue;
            }
            $existsInProducts = (int) $entityManager->createQueryBuilder()
                ->select('COUNT(p.id)')
                ->from(StockProduct::class, 'p')
                ->where('p.barcode = :code')
                ->setParameter('code', $code)
                ->getQuery()
                ->getSingleScalarResult() > 0;
            if ($existsInProducts) {
                continue;
            }

            return $code;
        }

        return strtoupper(bin2hex(random_bytes(4)));
    }
}
