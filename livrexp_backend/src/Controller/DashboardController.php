<?php

namespace App\Controller;

use App\Entity\Colis;
use App\Entity\User;
use App\Repository\BonLivraisonRepository;
use App\Repository\ColisRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('IS_AUTHENTICATED_FULLY')]
class DashboardController extends AbstractController
{
    #[Route('/dashboard', name: 'app_dashboard')]
    public function index(ColisRepository $colisRepo, BonLivraisonRepository $bonLivraisonRepo): Response
    {
        $user = $this->getUser();
        $isClientOnly = !$this->isGranted('ROLE_SUPERVISEUR');

        $qb = $colisRepo->createQueryBuilder('c')
            ->select('
                COUNT(c.id) as totalColis,
                SUM(CASE WHEN c.etat = :livre THEN 1 ELSE 0 END) as colisLivres,
                SUM(CASE WHEN c.etat = :preparation THEN 1 ELSE 0 END) as colisEnPreparation,
                SUM(CASE WHEN c.etat = :expedie THEN 1 ELSE 0 END) as colisExpedies,
                SUM(CASE WHEN c.etat = :retour THEN 1 ELSE 0 END) as colisRetournes,
                SUM(CASE WHEN c.etat = :cree THEN 1 ELSE 0 END) as colisCrees,
                SUM(c.price) as totalCrbt,
                SUM(CASE WHEN c.etat = :livre THEN c.price ELSE 0 END) as crbtLivres,
                SUM(CASE WHEN c.etat NOT IN (:excludedEtats) THEN c.price ELSE 0 END) as crbtEnCours
            ')
            ->setParameter('livre', Colis::ETAT_LIVRE)
            ->setParameter('preparation', Colis::ETAT_EN_PREPARATION)
            ->setParameter('expedie', Colis::ETAT_EXPEDIE)
            ->setParameter('retour', Colis::ETAT_RETOUR)
            ->setParameter('cree', Colis::ETAT_CREE)
            ->setParameter('excludedEtats', [Colis::ETAT_LIVRE, Colis::ETAT_RETOUR]);

        if ($isClientOnly && $user instanceof User) {
            $qb->andWhere('c.createdBy = :user')
               ->setParameter('user', $user);
        }

        $stats = $qb->getQuery()->getSingleResult();

        $totalColis = (int) $stats['totalColis'];
        $colisLivres = (int) $stats['colisLivres'];
        $colisEnPreparation = (int) $stats['colisEnPreparation'];
        $colisExpedies = (int) $stats['colisExpedies'];
        $colisRetournes = (int) $stats['colisRetournes'];
        $colisCrees = (int) $stats['colisCrees'];
        $totalCrbt = (float) $stats['totalCrbt'];
        $crbtLivres = (float) $stats['crbtLivres'];
        $crbtEnCours = (float) $stats['crbtEnCours'];

        // Recent items
        $recentColisQb = $colisRepo->createQueryBuilder('c')->orderBy('c.createdAt', 'DESC')->setMaxResults(5);
        if ($isClientOnly && $user instanceof User) {
            $recentColisQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $recentColis = $recentColisQb->getQuery()->getResult();

        $recentBonsQb = $bonLivraisonRepo->createQueryBuilder('b')->orderBy('b.createdAt', 'DESC')->setMaxResults(5);
        if ($isClientOnly && $user instanceof User) {
            $recentBonsQb->andWhere('b.createdBy = :user')->setParameter('user', $user);
        }
        $recentBons = $recentBonsQb->getQuery()->getResult();

        // Get volume statistics for active days
        $volumeQb = $colisRepo->createQueryBuilder('c')
            ->select("SUBSTRING(c.createdAt, 1, 10) as dateStr, COUNT(c.id) as cnt")
            ->groupBy('dateStr')
            ->orderBy('dateStr', 'DESC')
            ->setMaxResults(7);
        if ($isClientOnly && $user instanceof User) {
            $volumeQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $volumeStats = array_reverse($volumeQb->getQuery()->getResult());

        $chartLabels = [];
        $chartData = [];
        
        if (!empty($volumeStats)) {
            foreach ($volumeStats as $stat) {
                $date = \DateTime::createFromFormat('Y-m-d', $stat['dateStr']);
                if ($date) {
                    $chartLabels[] = $date->format('d M');
                } else {
                    $chartLabels[] = $stat['dateStr'];
                }
                $chartData[] = (int) $stat['cnt'];
            }
        } else {
            for ($i = 6; $i >= 0; $i--) {
                $dt = (new \DateTimeImmutable("-$i days"));
                $chartLabels[] = $dt->format('d M');
                $chartData[] = 0;
            }
        }

        return $this->render('dashboard/index.html.twig', [
            'totalColis' => $totalColis,
            'colisLivres' => $colisLivres,
            'colisEnPreparation' => $colisEnPreparation,
            'colisExpedies' => $colisExpedies,
            'colisRetournes' => $colisRetournes,
            'colisCrees' => $colisCrees,
            'totalCrbt' => (float) $totalCrbt,
            'crbtLivres' => (float) $crbtLivres,
            'crbtEnCours' => (float) $crbtEnCours,
            'recentColis' => $recentColis,
            'recentBons' => $recentBons,
            'chartLabels' => $chartLabels,
            'chartData' => $chartData,
        ]);
    }

    #[Route('/api/dashboard', name: 'app_api_dashboard', methods: ['GET'])]
    public function apiIndex(ColisRepository $colisRepo, BonLivraisonRepository $bonLivraisonRepo): Response
    {
        $user = $this->getUser();
        $isClientOnly = !$this->isGranted('ROLE_SUPERVISEUR');

        $qb = $colisRepo->createQueryBuilder('c')
            ->select('
                COUNT(c.id) as totalColis,
                SUM(CASE WHEN c.etat = :livre THEN 1 ELSE 0 END) as colisLivres,
                SUM(CASE WHEN c.etat = :preparation THEN 1 ELSE 0 END) as colisEnPreparation,
                SUM(CASE WHEN c.etat = :expedie THEN 1 ELSE 0 END) as colisExpedies,
                SUM(CASE WHEN c.etat = :retour THEN 1 ELSE 0 END) as colisRetournes,
                SUM(CASE WHEN c.etat = :cree THEN 1 ELSE 0 END) as colisCrees,
                SUM(c.price) as totalCrbt,
                SUM(CASE WHEN c.etat = :livre THEN c.price ELSE 0 END) as crbtLivres,
                SUM(CASE WHEN c.etat NOT IN (:excludedEtats) THEN c.price ELSE 0 END) as crbtEnCours
            ')
            ->setParameter('livre', Colis::ETAT_LIVRE)
            ->setParameter('preparation', Colis::ETAT_EN_PREPARATION)
            ->setParameter('expedie', Colis::ETAT_EXPEDIE)
            ->setParameter('retour', Colis::ETAT_RETOUR)
            ->setParameter('cree', Colis::ETAT_CREE)
            ->setParameter('excludedEtats', [Colis::ETAT_LIVRE, Colis::ETAT_RETOUR]);

        if ($isClientOnly && $user instanceof User) {
            $qb->andWhere('c.createdBy = :user')
               ->setParameter('user', $user);
        }

        $stats = $qb->getQuery()->getSingleResult();

        $totalColis = (int) $stats['totalColis'];
        $colisLivres = (int) $stats['colisLivres'];
        $colisEnPreparation = (int) $stats['colisEnPreparation'];
        $colisExpedies = (int) $stats['colisExpedies'];
        $colisRetournes = (int) $stats['colisRetournes'];
        $colisCrees = (int) $stats['colisCrees'];
        $totalCrbt = (float) $stats['totalCrbt'];
        $crbtLivres = (float) $stats['crbtLivres'];
        $crbtEnCours = (float) $stats['crbtEnCours'];

        // Recent items
        $recentColisQb = $colisRepo->createQueryBuilder('c')->orderBy('c.createdAt', 'DESC')->setMaxResults(5);
        if ($isClientOnly && $user instanceof User) {
            $recentColisQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $recentColis = $recentColisQb->getQuery()->getResult();

        $recentColisData = [];
        foreach ($recentColis as $colis) {
            $recentColisData[] = [
                'id' => $colis->getId(),
                'trackingCode' => $colis->getTrackingCode(),
                'productNature' => $colis->getProductNature(),
                'etatLabel' => $colis->getEtatLabel(),
                'etatBadgeClass' => $colis->getEtatBadgeClass(),
                'createdAt' => $colis->getCreatedAt() ? $colis->getCreatedAt()->format('d M, Y H:i') : '-',
                'city' => $colis->getCity(),
                'price' => (float)$colis->getPrice()
            ];
        }

        // Get volume statistics for active days (recorded vs delivered)
        $volumeQb = $colisRepo->createQueryBuilder('c')
            ->select("SUBSTRING(c.createdAt, 1, 10) as dateStr, COUNT(c.id) as cnt, SUM(CASE WHEN c.etat = :livre THEN 1 ELSE 0 END) as cntLivres")
            ->setParameter('livre', Colis::ETAT_LIVRE)
            ->groupBy('dateStr')
            ->orderBy('dateStr', 'DESC')
            ->setMaxResults(7);
        if ($isClientOnly && $user instanceof User) {
            $volumeQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $volumeStats = array_reverse($volumeQb->getQuery()->getResult());

        $chartLabels = [];
        $chartData = [];
        $chartDataLivres = [];
        
        if (!empty($volumeStats)) {
            foreach ($volumeStats as $stat) {
                $date = \DateTime::createFromFormat('Y-m-d', $stat['dateStr']);
                if ($date) {
                    $chartLabels[] = $date->format('d M');
                } else {
                    $chartLabels[] = $stat['dateStr'];
                }
                $chartData[] = (int) $stat['cnt'];
                $chartDataLivres[] = (int) $stat['cntLivres'];
            }
        } else {
            for ($i = 6; $i >= 0; $i--) {
                $dt = (new \DateTimeImmutable("-$i days"));
                $chartLabels[] = $dt->format('d M');
                $chartData[] = 0;
                $chartDataLivres[] = 0;
            }
        }

        return new \Symfony\Component\HttpFoundation\JsonResponse([
            'totalColis' => $totalColis,
            'colisLivres' => $colisLivres,
            'colisEnPreparation' => $colisEnPreparation,
            'colisExpedies' => $colisExpedies,
            'colisRetournes' => $colisRetournes,
            'colisCrees' => $colisCrees,
            'totalCrbt' => (float) $totalCrbt,
            'crbtLivres' => (float) $crbtLivres,
            'crbtEnCours' => (float) $crbtEnCours,
            'recentColis' => $recentColisData,
            'chartLabels' => $chartLabels,
            'chartData' => $chartData,
            'chartDataLivres' => $chartDataLivres,
        ]);
    }
}
