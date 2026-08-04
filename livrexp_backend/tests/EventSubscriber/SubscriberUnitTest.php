<?php

namespace App\Tests\EventSubscriber;

use App\Entity\Colis;
use App\EventSubscriber\ColisCrbtSubscriber;
use App\EventSubscriber\ColisWhatsAppSubscriber;
use App\Service\CrbtManager;
use App\Service\WhatsAppService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Event\PostFlushEventArgs;
use Doctrine\ORM\Event\PostPersistEventArgs;
use PHPUnit\Framework\TestCase;

class SubscriberUnitTest extends TestCase
{
    public function testColisWhatsAppSubscriberTriggersNotificationOnPostPersist(): void
    {
        $whatsAppService = $this->createMock(WhatsAppService::class);
        $subscriber = new ColisWhatsAppSubscriber($whatsAppService);

        $colis = new Colis();
        $colis->setPhoneNumber('0612345678');

        $em = $this->createMock(EntityManagerInterface::class);
        $args = new PostPersistEventArgs($colis, $em);

        $whatsAppService->expects($this->once())
            ->method('sendNotification')
            ->with($colis);

        $subscriber->postPersist($args);
        $this->assertNotNull($colis->getOtpCode());
    }

    public function testColisCrbtSubscriberQueuesAndFlushesCrbtOnPostFlush(): void
    {
        $crbtManager = $this->createMock(CrbtManager::class);
        $subscriber = new ColisCrbtSubscriber($crbtManager);

        $colis = new Colis();
        $colis->setPaymentType(Colis::PAYMENT_COD);

        $em = $this->createMock(EntityManagerInterface::class);
        $persistArgs = new PostPersistEventArgs($colis, $em);

        $subscriber->postPersist($persistArgs);

        $flushArgs = new PostFlushEventArgs($em);

        $crbtManager->expects($this->once())
            ->method('syncForColis')
            ->with($colis);

        $em->expects($this->once())->method('flush');

        $subscriber->postFlush($flushArgs);
    }
}
