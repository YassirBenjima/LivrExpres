<?php

namespace App\Tests\Functional;

use App\Service\WhatsAppService;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class WhatsAppApiTest extends WebTestCase
{
    private function initializeDatabase(): void
    {
        $container = static::getContainer();
        /** @var \Doctrine\ORM\EntityManagerInterface $em */
        $em = $container->get('doctrine.orm.entity_manager');
        
        $schemaTool = new SchemaTool($em);
        $metadata = $em->getMetadataFactory()->getAllMetadata();
        if (!empty($metadata)) {
            $schemaTool->updateSchema($metadata, true);
        }
    }

    public function testTestSendWithoutPhoneReturnsBadRequest(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('POST', '/api/whatsapp/test', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([]));

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertFalse($data['success']);
    }

    public function testTestSendWithPhoneReturnsSuccess(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $service = static::getContainer()->get(WhatsAppService::class);
        $refToken = new \ReflectionProperty(WhatsAppService::class, 'token');
        $refToken->setValue($service, '');
        $refPhoneId = new \ReflectionProperty(WhatsAppService::class, 'phoneId');
        $refPhoneId->setValue($service, '');

        $client->request('POST', '/api/whatsapp/test', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'phone' => '0612345678',
            'message' => 'Message de test API',
        ]));

        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertTrue($data['success']);
    }

    public function testVerifyOtpWithoutCodeReturnsBadRequest(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('POST', '/api/whatsapp/verify-otp', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([]));

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    public function testVerifyOtpNonExistentColisReturnsNotFound(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('POST', '/api/whatsapp/verify-otp', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'trackingCode' => 'INVALID-TRACKING-999',
            'otpCode' => '1234',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testGetLogsReturnsSuccess(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('GET', '/api/whatsapp/logs');

        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertTrue($data['success']);
    }
}
