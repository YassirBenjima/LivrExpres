<?php

namespace App\Tests\Entity;

use App\Entity\StockProduct;
use App\Entity\StockProductVariant;
use PHPUnit\Framework\TestCase;

class StockProductVariantTest extends TestCase
{
    public function testGettersSetters(): void
    {
        $product = new StockProduct('T-Shirt Premium', 'Vetements');
        $variant = new StockProductVariant('Rouge L', 50);
        $variant->setProduct($product);
        $variant->setBarcode('VAR-001');

        $this->assertSame($product, $variant->getProduct());
        $this->assertEquals('Rouge L', $variant->getName());
        $this->assertEquals(50, $variant->getQuantity());
        $this->assertEquals('VAR-001', $variant->getBarcode());
    }
}
