<?php

namespace App\Tests\Service;

use App\Entity\Colis;
use App\Entity\Crbt;
use App\Repository\CrbtRepository;
use App\Service\CrbtManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

class CrbtManagerTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private CrbtRepository $crbtRepository;
    private CrbtManager $manager;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->crbtRepository = $this->createMock(CrbtRepository::class);
        $this->manager = new CrbtManager($this->entityManager, $this->crbtRepository);
    }

    public function testSyncForColisReturnsNullWhenNotCodPayment(): void
    {
        $colis = $this->createMock(Colis::class);
        $colis->method('isCodPayment')->willReturn(false);

        $result = $this->manager->syncForColis($colis);
        $this->assertNull($result);
    }

    public function testCalculateAmountsWithDefaultFeeAndExtras(): void
    {
        $colis = new Colis();
        $colis->setPrice(200.0);
        $colis->setDeliveryFee(25.0);
        $colis->setCartonOption('m'); // +2.5
        $colis->setFragile(true); // +5.0

        $amounts = $this->manager->calculateAmounts($colis);

        $this->assertEquals(25.0, $amounts['frais']);
        $this->assertEquals(32.5, $amounts['montant_frais']); // 25 + 2.5 + 5.0
        $this->assertEquals(200.0, $amounts['montant']);
        $this->assertEquals(167.5, $amounts['balance']); // 200 - 32.5
    }

    public function testSyncForColisCreatesNewCrbtWhenCodPayment(): void
    {
        $colis = new Colis();
        $colis->setPaymentType(Colis::PAYMENT_COD); // isCodPayment() == true
        $colis->setPrice(150.0);
        $colis->setDeliveryFee(20.0);
        $colis->setEtat(Colis::ETAT_LIVRE);

        $this->crbtRepository->expects($this->once())
            ->method('findOneByColis')
            ->with($colis)
            ->willReturn(null);

        $this->entityManager->expects($this->once())
            ->method('persist')
            ->with($this->isInstanceOf(Crbt::class));

        $crbt = $this->manager->syncForColis($colis);

        $this->assertInstanceOf(Crbt::class, $crbt);
        $this->assertEquals('20.00', $crbt->getFrais());
        $this->assertEquals('150.00', $crbt->getMontant());
        $this->assertEquals(Crbt::STATUS_DISPONIBLE, $crbt->getStatus());
    }

    public function testSyncMissingEntriesFlushesWhenEntriesProcessed(): void
    {
        $colis1 = new Colis();
        $colis1->setPaymentType(Colis::PAYMENT_COD);
        $colis1->setPrice(100.0);

        $this->crbtRepository->expects($this->once())
            ->method('findColisEligibleWithoutCrbt')
            ->willReturn([$colis1]);

        $this->entityManager->expects($this->once())
            ->method('flush');

        $count = $this->manager->syncMissingEntries();
        $this->assertEquals(1, $count);
    }
}
