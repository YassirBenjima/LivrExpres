<?php

namespace App\EventSubscriber;

use App\Entity\Colis;
use App\Service\WhatsAppService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Events;

#[AsDoctrineListener(event: Events::postPersist)]
#[AsDoctrineListener(event: Events::postUpdate)]
final class ColisWhatsAppSubscriber
{
    public function __construct(
        private readonly WhatsAppService $whatsAppService,
    ) {}

    public function postPersist(PostPersistEventArgs $args): void
    {
        $entity = $args->getObject();
        if ($entity instanceof Colis) {
            $entity->generateOtpCode();
            $this->whatsAppService->sendNotification($entity);
        }
    }

    public function postUpdate(PostUpdateEventArgs $args): void
    {
        $entity = $args->getObject();
        if ($entity instanceof Colis) {
            $entity->generateOtpCode();
            $this->whatsAppService->sendNotification($entity);
        }
    }
}
