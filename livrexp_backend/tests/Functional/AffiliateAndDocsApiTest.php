<?php

namespace App\Tests\Functional;

use App\Entity\User;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class AffiliateAndDocsApiTest extends WebTestCase
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

    private function createTestUser(): User
    {
        $user = new User();
        $user->setEmail('affiliate_user_' . uniqid() . '@example.com');
        $user->setPassword('password123');
        $user->setFullName('Affiliate Test User');
        $user->setBusinessName('Affiliate Business');
        $user->setBusinessPhone('0612345679');
        $user->setCity('Rabat');
        $user->setRoles(['ROLE_CLIENT']);

        return $user;
    }

    public function testGetAffiliateInfoUnauthenticatedReturnsAccessDenied(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('GET', '/api/affiliate');

        $statusCode = $client->getResponse()->getStatusCode();
        $this->assertTrue(
            in_array($statusCode, [Response::HTTP_UNAUTHORIZED, Response::HTTP_FOUND, Response::HTTP_FORBIDDEN], true)
        );
    }

    public function testGetAffiliateInfoAuthenticatedReturnsSuccess(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $user = $this->createTestUser();

        $em = static::getContainer()->get('doctrine.orm.entity_manager');
        $em->persist($user);
        $em->flush();

        $client->loginUser($user);
        $client->request('GET', '/api/affiliate');

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('full_link', $data);
        $this->assertArrayHasKey('short_link', $data);
    }

    public function testGenerateApiKeyReturnsNewKey(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $user = $this->createTestUser();

        $em = static::getContainer()->get('doctrine.orm.entity_manager');
        $em->persist($user);
        $em->flush();

        $client->loginUser($user);
        $client->request('POST', '/api/api-docs/generate-key');

        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $client->getResponse()->getContent(), true);
        
        $this->assertArrayHasKey('api_key', $data);
        $this->assertNotEmpty($data['api_key']);
    }
}
