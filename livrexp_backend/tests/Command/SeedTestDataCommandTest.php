<?php

namespace App\Tests\Command;

use App\Command\SeedTestDataCommand;
use App\Repository\CityRepository;
use App\Service\TestDataSeeder;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;

class SeedTestDataCommandTest extends TestCase
{
    public function testSeedTestDataCommandExecutesSuccessfully(): void
    {
        $seeder = $this->createMock(TestDataSeeder::class);
        $cityRepo = $this->createMock(CityRepository::class);

        $seeder->expects($this->once())
            ->method('seed')
            ->willReturn([
                'users' => [
                    'client' => ['email' => 'client@test.com', 'password' => '123'],
                    'staff' => ['email' => 'staff@test.com', 'password' => '123'],
                    'livreur' => ['email' => 'livreur@test.com', 'password' => '123'],
                ],
                'colis' => 10,
                'pickups' => 3,
                'bons' => 2,
                'returns' => 1,
                'stock' => ['products' => 2, 'movements' => 1],
                'whatsapp_templates' => 2,
            ]);

        $command = new SeedTestDataCommand($seeder, $cityRepo);
        $commandTester = new CommandTester($command);

        $exitCode = $commandTester->execute([]);

        $this->assertEquals(0, $exitCode);
        $this->assertStringContainsString('Jeu de données de test prêt', $commandTester->getDisplay());
    }

    public function testSeedTestDataCommandPurgeOption(): void
    {
        $seeder = $this->createMock(TestDataSeeder::class);
        $cityRepo = $this->createMock(CityRepository::class);

        $seeder->expects($this->once())->method('purge');

        $command = new SeedTestDataCommand($seeder, $cityRepo);
        $commandTester = new CommandTester($command);

        $exitCode = $commandTester->execute(['--purge' => true]);

        $this->assertEquals(0, $exitCode);
        $this->assertStringContainsString('Données de test supprimées', $commandTester->getDisplay());
    }
}
