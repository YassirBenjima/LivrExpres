<?php

namespace App\Tests\Service;

use App\Entity\Colis;
use App\Service\WhatsAppService;
use PHPUnit\Framework\TestCase;

class WhatsAppServiceTest extends TestCase
{
    private WhatsAppService $service;

    protected function setUp(): void
    {
        $this->service = new WhatsAppService();
    }

    public function testSendNotificationReturnsErrorWhenNoPhoneProvided(): void
    {
        $colis = new Colis();
        $colis->setPhoneNumber('');

        $result = $this->service->sendNotification($colis);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Aucun numéro', $result['message']);
    }

    public function testBuildMessageForEnAttenteStatus(): void
    {
        $colis = new Colis();
        $colis->setOrderNumber('2026001');
        $colis->setRecipient('Yassir');
        $colis->setPrice('150.00');
        $colis->setCity('Casablanca');

        $message = $this->service->buildMessage($colis, Colis::STATUT_EN_ATTENTE, '1234');

        $this->assertNotNull($message);
        $this->assertStringContainsString('Colis Enregistré', $message);
        $this->assertStringContainsString('150.00 DH', $message);
        $this->assertStringContainsString('Casablanca', $message);
        $this->assertStringContainsString((string) $colis->getTrackingCode(), $message);
    }

    public function testBuildMessageForEnCoursStatusIncludesOtp(): void
    {
        $colis = new Colis();
        $colis->setOrderNumber('2026002');
        $colis->setRecipient('Karim');
        $colis->setPrice('300.00');
        $colis->setCity('Rabat');
        $colis->setEtat(Colis::ETAT_EXPEDIE);
        $colis->setStatut(Colis::STATUT_EN_COURS);

        $message = $this->service->buildMessage($colis, Colis::STATUT_EN_COURS, '9876');

        $this->assertNotNull($message);
        $this->assertStringContainsString('Livreur en route', $message);
        $this->assertStringContainsString('9876', $message);
    }

    public function testBuildMessageReturnsNullForUnmatchedStatusAndEtat(): void
    {
        $colis = $this->createMock(Colis::class);
        $colis->method('getEtat')->willReturn('Autre');
        $colis->method('getStatut')->willReturn('Autre');

        $message = $this->service->buildMessage($colis, 'UNKNOWN_STATUS_xyz', '0000');

        $this->assertNull($message);
    }

    public function testSendNotificationSimulatesWhatsAppMessageWhenTokenEmpty(): void
    {
        // Ensure empty token and phoneId for testing simulation mode
        $refToken = new \ReflectionProperty(WhatsAppService::class, 'token');
        $refToken->setValue($this->service, '');
        $refPhoneId = new \ReflectionProperty(WhatsAppService::class, 'phoneId');
        $refPhoneId->setValue($this->service, '');

        $colis = new Colis();
        $colis->setPhoneNumber('0612345678');
        $colis->setOrderNumber('2026003');
        $colis->setEtat(Colis::ETAT_LIVRE);
        $colis->setStatut(Colis::STATUT_TERMINE);

        $result = $this->service->sendNotification($colis);

        $this->assertTrue($result['success']);
        $this->assertStringContainsString('+212612345678', $result['phone']);
        $this->assertStringContainsString('Colis Livré', $result['content']);
    }
}
