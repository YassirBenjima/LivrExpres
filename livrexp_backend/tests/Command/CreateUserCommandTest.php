<?php

namespace App\Tests\Command;

use App\Command\CreateUserCommand;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class CreateUserCommandTest extends TestCase
{
    public function testExecuteCreatesUserSuccessfully(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $userRepo = $this->createMock(UserRepository::class);
        $hasher = $this->createMock(UserPasswordHasherInterface::class);

        $userRepo->method('findOneBy')->with(['email' => 'admin@example.com'])->willReturn(null);
        $hasher->method('hashPassword')->willReturn('hashed_pwd');

        $em->expects($this->once())->method('persist')->with($this::isInstanceOf(User::class));
        $em->expects($this->once())->method('flush');

        $command = new CreateUserCommand($em, $userRepo, $hasher);
        $commandTester = new CommandTester($command);

        $exitCode = $commandTester->execute([
            'email' => 'admin@example.com',
            'password' => 'secret123',
            'role' => 'ROLE_SUPER_ADMIN',
        ]);

        $this->assertEquals(0, $exitCode);
        $this->assertStringContainsString('created successfully', $commandTester->getDisplay());
    }
}
