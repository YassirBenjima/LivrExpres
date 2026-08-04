<?php

namespace App\Tests\Entity;

use App\Entity\BonLivraison;
use App\Entity\City;
use App\Entity\Crbt;
use App\Entity\PickupRequest;
use App\Entity\ReturnRequest;
use App\Entity\StockMovement;
use App\Entity\StockMovementItem;
use App\Entity\StockProduct;
use App\Entity\StockProductVariant;
use App\Entity\UserSettings;
use App\Entity\WhatsAppTemplate;
use PHPUnit\Framework\TestCase;

class AllEntitiesUnitTest extends TestCase
{
    public function testBonLivraisonGettersSettersAndStatusLabels(): void
    {
        $bon = new BonLivraison();
        $bon->setReference('BL-2026-001');
        $bon->setStatus(BonLivraison::STATUS_ENREGISTRE);

        $this->assertEquals('BL-2026-001', $bon->getReference());
        $this->assertEquals(BonLivraison::STATUS_ENREGISTRE, $bon->getStatus());
        $this->assertArrayHasKey(BonLivraison::STATUS_BROUILLON, BonLivraison::getStatusLabels());
        $this->assertArrayHasKey(BonLivraison::STATUS_ENREGISTRE, BonLivraison::getStatusLabels());
    }

    public function testCityGettersSetters(): void
    {
        $city = new City();
        $city->setName('Casablanca');

        $this->assertEquals('Casablanca', $city->getName());
    }

    public function testCrbtGettersSettersAndReferenceGenerator(): void
    {
        $crbt = new Crbt();
        $crbt->setFrais('25.00');
        $crbt->setMontant('200.00');
        $crbt->setBalance('175.00');
        $crbt->setStatus(Crbt::STATUS_DISPONIBLE);
        $crbt->generateReference();

        $this->assertEquals('25.00', $crbt->getFrais());
        $this->assertEquals('200.00', $crbt->getMontant());
        $this->assertEquals('175.00', $crbt->getBalance());
        $this->assertEquals(Crbt::STATUS_DISPONIBLE, $crbt->getStatus());
        $this->assertStringStartsWith('CRBT-', $crbt->getReference());
    }

    public function testPickupRequestGettersSetters(): void
    {
        $pickup = new PickupRequest();
        $pickup->setCity('Rabat');
        $pickup->setAddress('Agdal 12');
        $pickup->setStatus('confirmed');

        $this->assertEquals('Rabat', $pickup->getCity());
        $this->assertEquals('Agdal 12', $pickup->getAddress());
        $this->assertEquals('confirmed', $pickup->getStatus());
    }

    public function testReturnRequestGettersSetters(): void
    {
        $returnReq = new ReturnRequest();
        $returnReq->setReceptionType('En Agence');
        $returnReq->setBonReference('BR-2026-100');
        $returnReq->setStatus(ReturnRequest::STATUS_PROCESSING);

        $this->assertEquals('En Agence', $returnReq->getReceptionType());
        $this->assertEquals('BR-2026-100', $returnReq->getBonReference());
        $this->assertEquals(ReturnRequest::STATUS_PROCESSING, $returnReq->getStatus());
        $this->assertArrayHasKey(ReturnRequest::STATUS_PENDING, ReturnRequest::getStatusLabels());
    }

    public function testStockProductAndVariant(): void
    {
        $product = new StockProduct('T-Shirt Premium', 'Vetements');
        $product->setBarcode('TSHIRT-001');

        $variant = new StockProductVariant('Rouge L', 50);
        $variant->setProduct($product);
        $variant->setBarcode('VAR-001');

        $this->assertEquals('T-Shirt Premium', $product->getName());
        $this->assertEquals('TSHIRT-001', $product->getBarcode());
        $this->assertSame($product, $variant->getProduct());
        $this->assertEquals('Rouge L', $variant->getName());
        $this->assertEquals(50, $variant->getQuantity());
    }

    public function testStockMovementAndItem(): void
    {
        $movement = new StockMovement('MOV-2026-001');
        $movement->setDirection(StockMovement::DIRECTION_ENTRY);

        $variant = new StockProductVariant('Bleu M', 20);
        $item = new StockMovementItem($variant, 10);
        $item->setMovement($movement);

        $this->assertEquals(StockMovement::DIRECTION_ENTRY, $movement->getDirection());
        $this->assertEquals('MOV-2026-001', $movement->getReference());
        $this->assertSame($movement, $item->getMovement());
        $this->assertEquals(10, $item->getQuantity());
    }

    public function testUserSettingsDefaultGettersSetters(): void
    {
        $settings = new UserSettings();
        $settings->setParcelSettings(['fragile' => true]);
        $settings->setPackagingSettings(['cartons' => true]);

        $this->assertIsArray($settings->getParcelSettings());
        $this->assertTrue($settings->getParcelSettings()['fragile']);
    }

    public function testWhatsAppTemplateGettersSetters(): void
    {
        $template = new WhatsAppTemplate();
        $template->setTitle('Notification Livré');
        $template->setStatus(WhatsAppTemplate::STATUS_ACTIVE);
        $template->setMessage('Votre colis {tracking} est livré.');

        $this->assertEquals('Notification Livré', $template->getTitle());
        $this->assertEquals(WhatsAppTemplate::STATUS_ACTIVE, $template->getStatus());
        $this->assertStringContainsString('{tracking}', $template->getMessage());
    }
}
