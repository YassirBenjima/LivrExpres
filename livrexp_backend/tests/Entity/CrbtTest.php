<?php

namespace App\Tests\Entity;

use App\Entity\Crbt;
use PHPUnit\Framework\TestCase;

class CrbtTest extends TestCase
{
    public function testGettersSettersAndReferenceGenerator(): void
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
}
