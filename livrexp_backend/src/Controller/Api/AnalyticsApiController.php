<?php

namespace App\Controller\Api;

use App\Entity\Colis;
use App\Entity\User;
use App\Repository\ColisRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/analytics', name: 'api_analytics_')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class AnalyticsApiController extends AbstractController
{
    #[Route('/advanced', name: 'advanced', methods: ['GET'])]
    public function getAdvancedAnalytics(ColisRepository $colisRepo, Request $request): JsonResponse
    {
        $user = $this->getUser();
        $isClientOnly = !$this->isGranted('ROLE_SUPERVISEUR');
        $period = $request->query->get('period', 'month'); // 'today', 'week', 'month', 'year'

        $todayStr = (new \DateTimeImmutable())->format('Y-m-d');
        $firstDayOfMonthStr = (new \DateTimeImmutable('first day of this month'))->format('Y-m-d 00:00:00');
        $firstDayOfPrevMonthStr = (new \DateTimeImmutable('first day of last month'))->format('Y-m-d 00:00:00');
        $lastDayOfPrevMonthStr = (new \DateTimeImmutable('last day of last month'))->format('Y-m-d 23:59:59');
        $firstDayOfYearStr = (new \DateTimeImmutable('first day of January this year'))->format('Y-m-d 00:00:00');

        // 1. Stats Aujourd'hui
        $todayQb = $colisRepo->createQueryBuilder('c')
            ->select('
                COUNT(c.id) as totalToday,
                SUM(CASE WHEN c.etat = :livre THEN 1 ELSE 0 END) as livresToday,
                SUM(CASE WHEN c.etat = :retour THEN 1 ELSE 0 END) as retoursToday,
                SUM(CASE WHEN c.etat NOT IN (:finishedEtats) THEN 1 ELSE 0 END) as enCoursToday,
                SUM(CASE WHEN c.etat = :livre THEN c.price ELSE 0 END) as caToday
            ')
            ->where('c.createdAt LIKE :todayDate')
            ->setParameter('todayDate', $todayStr . '%')
            ->setParameter('livre', Colis::ETAT_LIVRE)
            ->setParameter('retour', Colis::ETAT_RETOUR)
            ->setParameter('finishedEtats', [Colis::ETAT_LIVRE, Colis::ETAT_RETOUR]);

        if ($isClientOnly && $user instanceof User) {
            $todayQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $todayStats = $todayQb->getQuery()->getSingleResult();

        // 2. Chiffre d'affaires & Totaux globaux
        $globalQb = $colisRepo->createQueryBuilder('c')
            ->select('
                COUNT(c.id) as totalGlobal,
                SUM(CASE WHEN c.etat = :livre THEN 1 ELSE 0 END) as livresGlobal,
                SUM(CASE WHEN c.etat = :retour THEN 1 ELSE 0 END) as retoursGlobal,
                SUM(CASE WHEN c.etat = :livre THEN c.price ELSE 0 END) as caGlobal,
                SUM(CASE WHEN c.etat = :livre AND c.createdAt >= :firstMonth THEN c.price ELSE 0 END) as caMonth,
                SUM(CASE WHEN c.etat = :livre AND c.createdAt >= :firstYear THEN c.price ELSE 0 END) as caYear
            ')
            ->setParameter('livre', Colis::ETAT_LIVRE)
            ->setParameter('retour', Colis::ETAT_RETOUR)
            ->setParameter('firstMonth', new \DateTimeImmutable('first day of this month 00:00:00'))
            ->setParameter('firstYear', new \DateTimeImmutable('first day of January this year 00:00:00'));

        if ($isClientOnly && $user instanceof User) {
            $globalQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $globalStats = $globalQb->getQuery()->getSingleResult();

        $totalGlobal = (int)$globalStats['totalGlobal'];
        $livresGlobal = (int)$globalStats['livresGlobal'];
        $retoursGlobal = (int)$globalStats['retoursGlobal'];
        $tauxLivraisonGlobal = $totalGlobal > 0 ? round(($livresGlobal / $totalGlobal) * 100, 1) : 0;
        $tauxRetourGlobal = $totalGlobal > 0 ? round(($retoursGlobal / $totalGlobal) * 100, 1) : 0;
        $alertReturnRate = $tauxRetourGlobal > 10.0;

        // 3. Comparaison Ce Mois vs Mois Précédent
        $monthQb = $colisRepo->createQueryBuilder('c')
            ->select('
                COUNT(c.id) as countCurrentMonth,
                SUM(CASE WHEN c.etat = :livre THEN c.price ELSE 0 END) as caCurrentMonth
            ')
            ->where('c.createdAt >= :firstMonth')
            ->setParameter('firstMonth', new \DateTimeImmutable('first day of this month 00:00:00'))
            ->setParameter('livre', Colis::ETAT_LIVRE);

        $prevMonthQb = $colisRepo->createQueryBuilder('c')
            ->select('
                COUNT(c.id) as countPrevMonth,
                SUM(CASE WHEN c.etat = :livre THEN c.price ELSE 0 END) as caPrevMonth
            ')
            ->where('c.createdAt >= :firstPrevMonth AND c.createdAt <= :lastPrevMonth')
            ->setParameter('firstPrevMonth', new \DateTimeImmutable('first day of last month 00:00:00'))
            ->setParameter('lastPrevMonth', new \DateTimeImmutable('last day of last month 23:59:59'))
            ->setParameter('livre', Colis::ETAT_LIVRE);

        if ($isClientOnly && $user instanceof User) {
            $monthQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
            $prevMonthQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }

        $monthData = $monthQb->getQuery()->getSingleResult();
        $prevMonthData = $prevMonthQb->getQuery()->getSingleResult();

        $countCurrentMonth = (int)$monthData['countCurrentMonth'];
        $countPrevMonth = (int)$prevMonthData['countPrevMonth'];
        $caCurrentMonth = (float)$monthData['caCurrentMonth'];
        $caPrevMonth = (float)$prevMonthData['caPrevMonth'];

        $volumeGrowth = $countPrevMonth > 0 ? round((($countCurrentMonth - $countPrevMonth) / $countPrevMonth) * 100, 1) : ($countCurrentMonth > 0 ? 100 : 0);
        $caGrowth = $caPrevMonth > 0 ? round((($caCurrentMonth - $caPrevMonth) / $caPrevMonth) * 100, 1) : ($caCurrentMonth > 0 ? 100 : 0);

        // 4. Trend Chart (14 derniers jours)
        $daysCount = $period === 'today' ? 1 : ($period === 'week' ? 7 : ($period === 'year' ? 30 : 14));
        $trendData = [];
        for ($i = $daysCount - 1; $i >= 0; $i--) {
            $dt = (new \DateTimeImmutable("-$i days"));
            $dStr = $dt->format('Y-m-d');
            $label = $dt->format('d M');

            $dayQb = $colisRepo->createQueryBuilder('c')
                ->select('
                    COUNT(c.id) as total,
                    SUM(CASE WHEN c.etat = :livre THEN 1 ELSE 0 END) as livres,
                    SUM(CASE WHEN c.etat = :retour THEN 1 ELSE 0 END) as retours
                ')
                ->where('c.createdAt LIKE :dtStr')
                ->setParameter('dtStr', $dStr . '%')
                ->setParameter('livre', Colis::ETAT_LIVRE)
                ->setParameter('retour', Colis::ETAT_RETOUR);

            if ($isClientOnly && $user instanceof User) {
                $dayQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
            }
            $res = $dayQb->getQuery()->getSingleResult();

            $trendData[] = [
                'date' => $label,
                'fullDate' => $dStr,
                'total' => (int)$res['total'],
                'livres' => (int)$res['livres'],
                'retours' => (int)$res['retours'],
            ];
        }

        // 5. Répartition par Statut (Donut Chart)
        $statusQb = $colisRepo->createQueryBuilder('c')
            ->select('c.etat as status, COUNT(c.id) as count')
            ->groupBy('c.etat');
        if ($isClientOnly && $user instanceof User) {
            $statusQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $statusRaw = $statusQb->getQuery()->getResult();
        $statusData = [];
        $statusColors = [
            'Livré' => '#27d37f',
            'Expédié' => '#1b84ff',
            'En préparation' => '#f6c000',
            'Créé' => '#7239ea',
            'Retourné' => '#f8285a',
            'Annulé' => '#888888',
        ];
        foreach ($statusRaw as $sr) {
            $st = $sr['status'] ?: 'Inconnu';
            $statusData[] = [
                'name' => $st,
                'value' => (int)$sr['count'],
                'color' => $statusColors[$st] ?? '#3f4254',
            ];
        }

        // 6. Répartition par Ville (Carte thermique / Top Villes)
        $cityQb = $colisRepo->createQueryBuilder('c')
            ->select('
                c.city as city,
                COUNT(c.id) as total,
                SUM(CASE WHEN c.etat = :livre THEN 1 ELSE 0 END) as livres,
                SUM(CASE WHEN c.etat = :retour THEN 1 ELSE 0 END) as retours,
                SUM(CASE WHEN c.etat = :livre THEN c.price ELSE 0 END) as ca
            ')
            ->groupBy('c.city')
            ->orderBy('total', 'DESC')
            ->setMaxResults(8)
            ->setParameter('livre', Colis::ETAT_LIVRE)
            ->setParameter('retour', Colis::ETAT_RETOUR);

        if ($isClientOnly && $user instanceof User) {
            $cityQb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $cityRaw = $cityQb->getQuery()->getResult();
        $cityData = [];
        foreach ($cityRaw as $cr) {
            if (!$cr['city']) continue;
            $tot = (int)$cr['total'];
            $liv = (int)$cr['livres'];
            $rate = $tot > 0 ? round(($liv / $tot) * 100, 1) : 0;
            $cityData[] = [
                'city' => $cr['city'],
                'total' => $tot,
                'livres' => $liv,
                'retours' => (int)$cr['retours'],
                'rate' => $rate,
                'ca' => (float)$cr['ca'],
            ];
        }

        return $this->json([
            'success' => true,
            'kpis' => [
                'today' => [
                    'colisCrees' => (int)$todayStats['totalToday'],
                    'colisLivres' => (int)$todayStats['livresToday'],
                    'colisRetournes' => (int)$todayStats['retoursToday'],
                    'colisEnCours' => (int)$todayStats['enCoursToday'],
                    'caToday' => (float)$todayStats['caToday'],
                ],
                'global' => [
                    'totalColis' => $totalGlobal,
                    'colisLivres' => $livresGlobal,
                    'colisRetournes' => $retoursGlobal,
                    'tauxLivraisonGlobal' => $tauxLivraisonGlobal,
                    'tauxRetourGlobal' => $tauxRetourGlobal,
                    'alertReturnRate' => $alertReturnRate,
                    'caToday' => (float)$todayStats['caToday'],
                    'caMonth' => (float)$globalStats['caMonth'],
                    'caYear' => (float)$globalStats['caYear'],
                ],
                'comparison' => [
                    'currentMonthTotal' => $countCurrentMonth,
                    'prevMonthTotal' => $countPrevMonth,
                    'volumeGrowth' => $volumeGrowth,
                    'currentMonthCa' => $caCurrentMonth,
                    'prevMonthCa' => $caPrevMonth,
                    'caGrowth' => $caGrowth,
                ]
            ],
            'trendData' => $trendData,
            'statusData' => $statusData,
            'cityData' => $cityData,
        ]);
    }

    #[Route('/export', name: 'export', methods: ['GET'])]
    public function exportReport(ColisRepository $colisRepo): Response
    {
        $user = $this->getUser();
        $isClientOnly = !$this->isGranted('ROLE_SUPERVISEUR');

        $qb = $colisRepo->createQueryBuilder('c')->orderBy('c.createdAt', 'DESC');
        if ($isClientOnly && $user instanceof User) {
            $qb->andWhere('c.createdBy = :user')->setParameter('user', $user);
        }
        $colisList = $qb->getQuery()->getResult();

        $rows = [];
        $rows[] = implode(';', ['Code Suivi', 'N° Commande', 'Destinataire', 'Téléphone', 'Ville', 'Adresse', 'Prix (MAD)', 'État', 'Statut', 'Date Création']);

        foreach ($colisList as $colis) {
            $rows[] = implode(';', [
                $colis->getTrackingCode() ?? '',
                $colis->getOrderNumber() ?? '',
                '"' . str_replace('"', '""', $colis->getRecipient() ?? '') . '"',
                $colis->getPhone() ?? '',
                '"' . str_replace('"', '""', $colis->getCity() ?? '') . '"',
                '"' . str_replace('"', '""', $colis->getAddress() ?? '') . '"',
                $colis->getPrice() ?? '0',
                $colis->getEtat() ?? '',
                $colis->getStatut() ?? '',
                $colis->getCreatedAt() ? $colis->getCreatedAt()->format('Y-m-d H:i') : '',
            ]);
        }

        $csv = "\xEF\xBB\xBF" . implode("\r\n", $rows);
        $response = new Response($csv);
        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="rapport_analytics_' . date('Y-m-d_H-i') . '.csv"');

        return $response;
    }
}
