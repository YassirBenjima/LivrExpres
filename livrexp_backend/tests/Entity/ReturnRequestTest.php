<?php

namespace App\Tests\Entity;

use App\Entity\ReturnRequest;
use PHPUnit\Framework\TestCase;

class ReturnRequestTest extends TestCase
{
    public function testGettersSetters(): void
    {
        $returnReq = new ReturnRequest();
        $returnReq->setReceptionType('En Agence');
        $returnReq->setBonReference('BR-2026-100');
        $returnReq->setStatus(ReturnRequest::STATUS_PROCESSING);

        $this->assertEquals('En Agence', $returnReq->getReceptionType());
        $this->assertEquals('BR-2026-100', $returnReq->getBonReference());
        $this->assertEquals(ReturnRequest::STATUS_PROCESSING, $returnReq->getStatus());
        $this->assertArrayHasKey(ReturnRequest::STATUS_PENDING, ReturnRequest::getStatusLabels());
    }
}
