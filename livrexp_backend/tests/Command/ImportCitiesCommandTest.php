<?php

namespace App\Tests\Command;

use App\Command\ImportCitiesCommand;
use App\Entity\City;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;

class ImportCitiesCommandTest extends TestCase
{
    public function testImportCitiesCommandExecutesSuccessfully(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $repo = $this->createMock(EntityRepository::class);

        $em->method('getRepository')->with(City::class)->willReturn($repo);
        $repo->method('findOneBy')->willReturn(null);

        $em->expects($this->atLeastOnce())->method('persist');
        $em->expects($this->atLeastOnce())->method('flush');

        $command = new ImportCitiesCommand($em);
        $commandTester = new CommandTester($command);

        $exitCode = $commandTester->execute([]);

        $this->assertEquals(0, $exitCode);
        $this->assertStringContainsString('imported 380 cities', $commandTester->getDisplay());
    }
}
