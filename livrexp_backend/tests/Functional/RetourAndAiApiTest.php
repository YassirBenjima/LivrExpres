<?php

namespace App\Tests\Functional;

use App\Entity\User;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class RetourAndAiApiTest extends WebTestCase
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
        $user->setEmail('retour_user_' . uniqid() . '@example.com');
        $user->setPassword('password123');
        $user->setFullName('Retour User');
        $user->setBusinessName('Retour Corp');
        $user->setBusinessPhone('0600000006');
        $user->setCity('Casablanca');
        $user->setRoles(['ROLE_CLIENT']);

        return $user;
    }

    public function testGetDemandesRetourUnauthenticatedReturnsAccessDenied(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('GET', '/api/retour/demandes');

        $statusCode = $client->getResponse()->getStatusCode();
        $this->assertTrue(
            in_array($statusCode, [Response::HTTP_UNAUTHORIZED, Response::HTTP_FOUND, Response::HTTP_FORBIDDEN], true)
        );
    }

    public function testGetDemandesRetourAuthenticatedReturnsSuccess(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $user = $this->createTestUser();

        $em = static::getContainer()->get('doctrine.orm.entity_manager');
        $em->persist($user);
        $em->flush();

        $client->loginUser($user);
        $client->request('GET', '/api/retour/demandes');

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
    }

    public function testGetAdminAiRecentParcelsReturnsSuccess(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('GET', '/api/admin/ai-assistant/recent-parcels');

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertTrue($data['success']);
    }
}
