<?php

namespace App\Tests\Functional;

use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class SecurityControllerTest extends WebTestCase
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

    public function testLoginPageLoadsSuccessfully(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('GET', '/login');

        $this->assertResponseIsSuccessful();
        $this->assertSelectorExists('form');
    }

    public function testStaffLoginPageLoadsSuccessfully(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('GET', '/login/staff');

        $this->assertResponseIsSuccessful();
    }

    public function testForgotPasswordPageLoadsSuccessfully(): void
    {
        $client = static::createClient();
        $this->initializeDatabase();

        $client->request('GET', '/forgot-password');

        $this->assertResponseIsSuccessful();
    }
}
