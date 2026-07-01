<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\CityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Notifier\Notification\Notification;
use Symfony\Component\Notifier\NotifierInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

final class RegistrationController extends AbstractController
{
    #[Route('/register', name: 'app_register')]
    public function register(
        Request $request,
        UserPasswordHasherInterface $userPasswordHasher,
        EntityManagerInterface $entityManager,
        CityRepository $cityRepository,
        NotifierInterface $notifier
    ): Response {
        if ($this->getUser()) {
            return $this->redirectToRoute('app_login');
        }

        $error = null;
        if ($request->isMethod('POST')) {
            $email = $request->request->get('email');
            $password = $request->request->get('password');
            $confirmPassword = $request->request->get('confirm_password');
            $fullName = $request->request->get('full_name');
            $businessName = $request->request->get('business_name');
            $businessPhone = $request->request->get('business_phone');
            $city = $request->request->get('city');

            if ($password !== $confirmPassword) {
                $message = 'Les mots de passe saisis ne correspondent pas.';
                $this->addFlash('error', $message);
                $notifier->send((new Notification($message, ['browser']))->importance(Notification::IMPORTANCE_HIGH));
                return $this->redirectToRoute('app_register');
            } else {
                $existingUser = $entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
                $existingBusiness = $entityManager->getRepository(User::class)->findOneBy(['businessName' => $businessName]);
                
                if ($existingUser) {
                    $message = 'Cette adresse email est déjà associée à un compte.';
                    $this->addFlash('error', $message);
                    $notifier->send((new Notification($message, ['browser']))->importance(Notification::IMPORTANCE_HIGH));
                    return $this->redirectToRoute('app_register');
                } elseif ($existingBusiness) {
                    $message = 'Ce nom d\'entreprise est déjà enregistré sur notre plateforme.';
                    $this->addFlash('error', $message);
                    $notifier->send((new Notification($message, ['browser']))->importance(Notification::IMPORTANCE_HIGH));
                    return $this->redirectToRoute('app_register');
                } else {
                    $user = new User();
                    $user->setEmail($email);
                    $user->setFullName($fullName);
                    $user->setBusinessName($businessName);
                    $user->setBusinessPhone($businessPhone);
                    $user->setCity($city);
                    $user->setRoles(['ROLE_CLIENT']);
                    
                    // Hash the password
                    $user->setPassword(
                        $userPasswordHasher->hashPassword(
                            $user,
                            $password
                        )
                    );

                    $entityManager->persist($user);
                    $entityManager->flush();

                    $this->addFlash('success', 'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.');
                    return $this->redirectToRoute('app_login');
                }
            }
        }

        $cities = $cityRepository->findBy([], ['name' => 'ASC']);

        return $this->render('registration/register.html.twig', [
            'cities' => $cities,
            'error' => $error,
        ]);
    }

    #[Route('/api/cities', name: 'app_api_cities', methods: ['GET'])]
    public function apiCities(CityRepository $cityRepository): Response
    {
        $cities = $cityRepository->createQueryBuilder('c')
            ->select('c.id', 'c.name')
            ->orderBy('c.name', 'ASC')
            ->getQuery()
            ->getArrayResult();

        $data = [];
        foreach ($cities as $city) {
            $data[] = [
                'id' => $city['id'],
                'name' => $city['name']
            ];
        }
        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    #[Route('/api/register', name: 'app_api_register', methods: ['POST'])]
    public function apiRegister(
        Request $request,
        UserPasswordHasherInterface $userPasswordHasher,
        EntityManagerInterface $entityManager,
        NotifierInterface $notifier
    ): Response {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        $confirmPassword = $data['confirm_password'] ?? null;
        $fullName = $data['full_name'] ?? null;
        $businessName = $data['business_name'] ?? null;
        $businessPhone = $data['business_phone'] ?? null;
        $city = $data['city'] ?? null;

        if (!$email || !$password || !$fullName || !$businessName || !$businessPhone || !$city) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Veuillez remplir tous les champs obligatoires.'
            ], 400);
        }

        if ($password !== $confirmPassword) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Les mots de passe saisis ne correspondent pas.'
            ], 400);
        }

        $existingUser = $entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
        $existingBusiness = $entityManager->getRepository(User::class)->findOneBy(['businessName' => $businessName]);

        if ($existingUser) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Cette adresse email est déjà associée à un compte.'
            ], 400);
        }

        if ($existingBusiness) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Ce nom d\'entreprise est déjà enregistré sur notre plateforme.'
            ], 400);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setFullName($fullName);
        $user->setBusinessName($businessName);
        $user->setBusinessPhone($businessPhone);
        $user->setCity($city);
        $user->setRoles(['ROLE_CLIENT']);
        
        $user->setPassword(
            $userPasswordHasher->hashPassword(
                $user,
                $password
            )
        );

        $entityManager->persist($user);
        $entityManager->flush();

        return new \Symfony\Component\HttpFoundation\JsonResponse([
            'status' => 'success',
            'message' => 'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.'
        ]);
    }
}
