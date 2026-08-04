<?php

namespace App\Tests\Entity;

use App\Entity\Colis;
use PHPUnit\Framework\TestCase;

class ColisTest extends TestCase
{
    public function testColisDefaultValuesAndGetters(): void
    {
        $colis = new Colis();
        $this->assertEquals(Colis::ETAT_CREE, $colis->getEtat());
        $this->assertEquals(Colis::STATUT_EN_ATTENTE, $colis->getStatut());
        $this->assertEquals(Colis::PAYMENT_CRBT, $colis->getPaymentType());
        $this->assertTrue($colis->isCodPayment());
        $this->assertEquals('40.00', $colis->getDeliveryFee());
    }

    public function testColisOrderNumberNormalizesDigitsAndGeneratesTrackingCode(): void
    {
        $colis = new Colis();
        $colis->setOrderNumber('CMD-2026-999');

        $this->assertEquals('CMD-2026999', $colis->getOrderNumber());
        $this->assertNotNull($colis->getTrackingCode());
        $this->assertStringStartsWith('F-', $colis->getTrackingCode());
        $this->assertStringEndsWith('-2026999', $colis->getTrackingCode());
    }

    public function testColisOtpCodeGeneration(): void
    {
        $colis = new Colis();
        $this->assertNull($colis->getOtpCode());

        $otp = $colis->generateOtpCode();
        $this->assertEquals(4, strlen($otp));
        $this->assertEquals($otp, $colis->getOtpCode());
    }

    public function testColisNormalizeEtatAndStatutBadgeClasses(): void
    {
        $this->assertEquals(Colis::ETAT_LIVRE, Colis::normalizeEtatLabel('Livre'));
        $this->assertEquals(Colis::ETAT_RETOUR, Colis::normalizeEtatLabel('Retour'));
        $this->assertEquals('kt-badge-success', Colis::resolveEtatBadgeClass(Colis::ETAT_LIVRE));
        $this->assertEquals('kt-badge-destructive', Colis::resolveEtatBadgeClass(Colis::ETAT_RETOUR));

        $this->assertEquals(Colis::STATUT_TERMINE, Colis::normalizeStatutLabel('Termine'));
        $this->assertEquals('kt-badge-success', Colis::resolveStatutBadgeClass(Colis::STATUT_TERMINE));
    }
}
