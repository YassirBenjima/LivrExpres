<?php

namespace App\Tests\Entity;

use App\Entity\StockMovement;
use PHPUnit\Framework\TestCase;

class StockMovementTest extends TestCase
{
    public function testGettersSetters(): void
    {
        $movement = new StockMovement('MOV-2026-001');
        $movement->setDirection(StockMovement::DIRECTION_ENTRY);

        $this->assertEquals(StockMovement::DIRECTION_ENTRY, $movement->getDirection());
        $this->assertEquals('MOV-2026-001', $movement->getReference());
    }
}
