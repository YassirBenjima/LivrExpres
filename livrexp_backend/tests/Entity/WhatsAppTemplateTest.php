<?php

namespace App\Tests\Entity;

use App\Entity\WhatsAppTemplate;
use PHPUnit\Framework\TestCase;

class WhatsAppTemplateTest extends TestCase
{
    public function testWhatsAppTemplateGettersSetters(): void
    {
        $template = new WhatsAppTemplate();
        $template->setTitle('Notification Livré');
        $template->setStatus(WhatsAppTemplate::STATUS_ACTIVE);
        $template->setMessage('Votre colis {tracking} est livré.');

        $this->assertEquals('Notification Livré', $template->getTitle());
        $this->assertEquals(WhatsAppTemplate::STATUS_ACTIVE, $template->getStatus());
        $this->assertStringContainsString('{tracking}', $template->getMessage());
    }
}
