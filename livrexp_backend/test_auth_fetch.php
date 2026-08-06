<?php
require __DIR__ . '/vendor/autoload.php';

use App\Kernel;
use Symfony\Component\Dotenv\Dotenv;
use Symfony\Component\HttpFoundation\Request;

(new Dotenv())->bootEnv(__DIR__.'/.env');

$kernel = new Kernel('dev', true);
$kernel->boot();

// Login test.client@livrexp.test via POST /login
$request = Request::create('/login', 'POST', [], [], [], [
    'CONTENT_TYPE' => 'application/json',
    'HTTP_ACCEPT' => 'application/json',
], json_encode(['username' => 'test.client@livrexp.test', 'password' => 'Test1234!']));

$response = $kernel->handle($request);
$cookies = $response->headers->getCookies();
$cookieHeader = '';
foreach ($cookies as $cookie) {
    $cookieHeader .= $cookie->getName() . '=' . $cookie->getValue() . '; ';
}

// Reboot kernel for second sub-request
$kernel->shutdown();
$kernel->boot();

// Now request /api/stock/colis with cookies
$apiRequest = Request::create('/api/stock/colis', 'GET', [], [], [], [
    'HTTP_ACCEPT' => 'application/json',
    'HTTP_COOKIE' => $cookieHeader,
]);

$apiResponse = $kernel->handle($apiRequest);
echo "API STATUS: " . $apiResponse->getStatusCode() . "\n";
echo "API CONTENT: " . substr($apiResponse->getContent(), 0, 1000) . "\n";
