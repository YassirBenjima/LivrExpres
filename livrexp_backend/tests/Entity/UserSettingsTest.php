<?php

namespace App\Tests\Entity;

use App\Entity\UserSettings;
use PHPUnit\Framework\TestCase;

class UserSettingsTest extends TestCase
{
    public function testUserSettingsGettersSetters(): void
    {
        $settings = new UserSettings();
        $settings->setParcelSettings(['fragile' => true]);
        $settings->setPackagingSettings(['cartons' => true]);

        $this->assertIsArray($settings->getParcelSettings());
        $this->assertTrue($settings->getParcelSettings()['fragile']);
    }
}
