<?php

namespace App\Tests\Functional;

use App\Entity\User;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class NotificationApiTest extends WebTestCase
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
        $user->setEmail('notif_user_' . uniqid() . '@example.com');
        $user->setPassword('password123');
        $user->setFullName('Notif User');
        $user->setBusinessName('Notif Business');
        $user->setBusinessPhone('0600000001');
        $user->setCity('Casablanca');
        $user->setRoles(['ROLE_CLIENT']);

        return $user;
    }

    public function testGetNotificationsUnauthenticatedReturnsUnauthorized(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('GET', '/api/notifications');

        $statusCode = $client->getResponse()->getStatusCode();
        $this->assertTrue(
            in_array($statusCode, [Response::HTTP_UNAUTHORIZED, Response::HTTP_FOUND, Response::HTTP_FORBIDDEN], true)
        );
    }

    public function testGetNotificationsAuthenticatedReturnsSuccess(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $user = $this->createTestUser();

        $em = static::getContainer()->get('doctrine.orm.entity_manager');
        $em->persist($user);
        $em->flush();

        $client->loginUser($user);
        $client->request('GET', '/api/notifications');

        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $client->getResponse()->getContent(), true);

        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('notifications', $data);
        $this->assertArrayHasKey('unreadCount', $data);
    }

    public function testMarkAllNotificationsAsRead(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $user = $this->createTestUser();

        $em = static::getContainer()->get('doctrine.orm.entity_manager');
        $em->persist($user);
        $em->flush();

        $client->loginUser($user);
        $client->request('POST', '/api/notifications/read-all');

        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertTrue($data['success']);
    }

    public function testMarkSingleNotificationAsRead(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $user = $this->createTestUser();

        $em = static::getContainer()->get('doctrine.orm.entity_manager');
        $em->persist($user);
        $em->flush();

        $client->loginUser($user);
        $client->request('PATCH', '/api/notifications/sys-welcome/read');

        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertTrue($data['success']);
    }
}
