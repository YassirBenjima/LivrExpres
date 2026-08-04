<?php

namespace App\Tests\Entity;

use App\Entity\StockProduct;
use PHPUnit\Framework\TestCase;

class StockProductTest extends TestCase
{
    public function testGettersSetters(): void
    {
        $product = new StockProduct('T-Shirt Premium', 'Vetements');
        $product->setBarcode('TSHIRT-001');

        $this->assertEquals('T-Shirt Premium', $product->getName());
        $this->assertEquals('Vetements', $product->getCategory());
        $this->assertEquals('TSHIRT-001', $product->getBarcode());
    }
}
