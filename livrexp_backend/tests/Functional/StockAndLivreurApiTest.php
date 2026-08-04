<?php

namespace App\Tests\Functional;

use App\Entity\User;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class StockAndLivreurApiTest extends WebTestCase
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
        $user->setEmail('stock_user_' . uniqid() . '@example.com');
        $user->setPassword('password123');
        $user->setFullName('Stock User');
        $user->setBusinessName('Stock Corp');
        $user->setBusinessPhone('0600000005');
        $user->setCity('Casablanca');
        $user->setRoles(['ROLE_CLIENT']);

        return $user;
    }

    public function testGetStockProductsUnauthenticatedReturnsAccessDenied(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('GET', '/api/stock/products');

        $statusCode = $client->getResponse()->getStatusCode();
        $this->assertTrue(
            in_array($statusCode, [Response::HTTP_UNAUTHORIZED, Response::HTTP_FOUND, Response::HTTP_FORBIDDEN], true)
        );
    }

    public function testGetStockProductsAuthenticatedReturnsJsonResponse(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $user = $this->createTestUser();

        $em = static::getContainer()->get('doctrine.orm.entity_manager');
        $em->persist($user);
        $em->flush();

        $client->loginUser($user);
        $client->request('GET', '/api/stock/products');

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
    }

    public function testGetLivreursListReturnsJsonResponse(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('GET', '/api/livreurs');

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
    }

    public function testUpdateDriverLocationWithoutCoordsReturnsBadRequest(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('POST', '/api/driver/location', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([]));

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }
}
