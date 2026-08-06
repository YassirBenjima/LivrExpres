<?php
require __DIR__ . '/vendor/autoload.php';

use App\Kernel;
use App\Entity\Colis;
use App\Entity\User;
use Symfony\Component\Dotenv\Dotenv;

(new Dotenv())->bootEnv(__DIR__.'/.env');

$kernel = new Kernel('dev', true);
$kernel->boot();

$container = $kernel->getContainer();
$em = $container->get('doctrine.orm.entity_manager');
$repo = $em->getRepository(Colis::class);

try {
    $qb = $repo->createQueryBuilder('c')
        ->where('(c.type = :typeStock OR c.type = :typeStockShort OR LOWER(c.type) LIKE :typeStockLike)')
        ->setParameter('typeStock', Colis::TYPE_STOCK)
        ->setParameter('typeStockShort', 'stock')
        ->setParameter('typeStockLike', '%stock%')
        ->orderBy('c.id', 'DESC');

    $res = $qb->getQuery()->getResult();
    echo "SUCCESS! Count: " . count($res) . "\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
