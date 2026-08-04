<?php

namespace App\Tests\Entity;

use App\Entity\PickupRequest;
use PHPUnit\Framework\TestCase;

class PickupRequestTest extends TestCase
{
    public function testGettersSetters(): void
    {
        $pickup = new PickupRequest();
        $pickup->setCity('Rabat');
        $pickup->setAddress('Agdal 12');
        $pickup->setStatus('confirmed');

        $this->assertEquals('Rabat', $pickup->getCity());
        $this->assertEquals('Agdal 12', $pickup->getAddress());
        $this->assertEquals('confirmed', $pickup->getStatus());
    }
}
