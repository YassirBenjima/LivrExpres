<?php

namespace App\Tests\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    public function testUserRolesAndProperties(): void
    {
        $user = new User();
        $user->setEmail('john@example.com');
        $user->setFullName('John Doe');
        $user->setRoles(['ROLE_ADMIN']);

        $this->assertEquals('john@example.com', $user->getEmail());
        $this->assertEquals('John Doe', $user->getFullName());
        $this->assertContains('ROLE_ADMIN', $user->getRoles());
        $this->assertContains('ROLE_USER', $user->getRoles());
        $this->assertEquals('john@example.com', $user->getUserIdentifier());
    }
}
