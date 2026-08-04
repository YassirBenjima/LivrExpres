<?php

namespace App\Tests\Entity;

use App\Entity\City;
use PHPUnit\Framework\TestCase;

class CityTest extends TestCase
{
    public function testGettersSetters(): void
    {
        $city = new City();
        $city->setName('Casablanca');

        $this->assertEquals('Casablanca', $city->getName());
    }
}
