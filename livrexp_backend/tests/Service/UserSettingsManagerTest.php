<?php

namespace App\Tests\Service;

use App\Entity\User;
use App\Entity\UserSettings;
use App\Repository\UserSettingsRepository;
use App\Service\UserSettingsManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

class UserSettingsManagerTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private UserSettingsRepository $repository;
    private UserSettingsManager $manager;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->repository = $this->createMock(UserSettingsRepository::class);
        $this->manager = new UserSettingsManager($this->entityManager, $this->repository);
    }

    public function testGetOrCreateForUserReturnsExistingSettings(): void
    {
        $user = new User();
        $existingSettings = new UserSettings();

        $this->repository->expects($this->once())
            ->method('findOneByUser')
            ->with($user)
            ->willReturn($existingSettings);

        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $result = $this->manager->getOrCreateForUser($user);
        $this->assertSame($existingSettings, $result);
    }

    public function testGetOrCreateForUserCreatesNewSettingsWhenNoneExist(): void
    {
        $user = new User();

        $this->repository->expects($this->once())
            ->method('findOneByUser')
            ->with($user)
            ->willReturn(null);

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $result = $this->manager->getOrCreateForUser($user);

        $this->assertInstanceOf(UserSettings::class, $result);
        $this->assertSame($user, $result->getUser());
        $this->assertIsArray($result->getParcelSettings());
        $this->assertIsArray($result->getPackagingSettings());
    }

    public function testDefaultParcelSettingsStructure(): void
    {
        $settings = $this->manager->defaultParcelSettings();

        $this->assertArrayHasKey('fragile', $settings);
        $this->assertArrayHasKey('open_colis', $settings);
        $this->assertArrayHasKey('unique_order_number', $settings);
        $this->assertEquals(5.0, $settings['fragile']['fee']);
    }

    public function testDefaultPackagingSettingsStructure(): void
    {
        $settings = $this->manager->defaultPackagingSettings();

        $this->assertArrayHasKey('cartons', $settings);
        $this->assertArrayHasKey('sachets', $settings);
        $this->assertArrayHasKey('bubble_wrap', $settings);
        $this->assertEquals(1.5, $settings['cartons']['fees']['S']);
    }
}
