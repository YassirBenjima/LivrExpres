<?php

namespace App\Tests\Entity;

use App\Entity\BonLivraison;
use PHPUnit\Framework\TestCase;

class BonLivraisonTest extends TestCase
{
    public function testGettersSettersAndStatusLabels(): void
    {
        $bon = new BonLivraison();
        $bon->setReference('BL-2026-001');
        $bon->setStatus(BonLivraison::STATUS_ENREGISTRE);

        $this->assertEquals('BL-2026-001', $bon->getReference());
        $this->assertEquals(BonLivraison::STATUS_ENREGISTRE, $bon->getStatus());
        $this->assertArrayHasKey(BonLivraison::STATUS_BROUILLON, BonLivraison::getStatusLabels());
        $this->assertArrayHasKey(BonLivraison::STATUS_ENREGISTRE, BonLivraison::getStatusLabels());
    }
}
