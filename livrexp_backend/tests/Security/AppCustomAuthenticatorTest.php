<?php

namespace App\Tests\Security;

use App\Security\AppCustomAuthenticator;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class AppCustomAuthenticatorTest extends TestCase
{
    public function testSupportsReturnsTrueForPostLoginRoutes(): void
    {
        $urlGenerator = $this->createMock(UrlGeneratorInterface::class);
        $urlGenerator->method('generate')->willReturnCallback(function ($name) {
            return match ($name) {
                AppCustomAuthenticator::LOGIN_ROUTE => '/login',
                AppCustomAuthenticator::LOGIN_STAFF_ROUTE => '/login/staff',
                default => '/',
            };
        });

        $authenticator = new AppCustomAuthenticator($urlGenerator);

        $loginRequest = Request::create('/login', 'POST');
        $this->assertTrue($authenticator->supports($loginRequest));

        $getLoginRequest = Request::create('/login', 'GET');
        $this->assertFalse($authenticator->supports($getLoginRequest));
    }
}
