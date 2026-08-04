<?php

namespace App\Tests\Entity;

use App\Entity\StockMovement;
use App\Entity\StockMovementItem;
use App\Entity\StockProductVariant;
use PHPUnit\Framework\TestCase;

class StockMovementItemTest extends TestCase
{
    public function testGettersSetters(): void
    {
        $movement = new StockMovement('MOV-2026-001');
        $variant = new StockProductVariant('Bleu M', 20);
        
        $item = new StockMovementItem($variant, 10);
        $item->setMovement($movement);

        $this->assertSame($movement, $item->getMovement());
        $this->assertSame($variant, $item->getVariant());
        $this->assertEquals(10, $item->getQuantity());
    }
}
