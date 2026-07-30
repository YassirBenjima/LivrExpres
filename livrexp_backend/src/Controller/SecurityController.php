<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

final class SecurityController extends AbstractController
{
    #[Route(path: '/login', name: 'app_login')]
    public function login(AuthenticationUtils $authenticationUtils): Response
    {
        // if ($this->getUser()) {
        //     return $this->redirectToRoute('target_path');
        // }

        // get the login error if there is one
        $error = $authenticationUtils->getLastAuthenticationError();
        // last username entered by the user
        $lastUsername = $authenticationUtils->getLastUsername();

    return $this->render('security/login.html.twig', ['last_username' => $lastUsername, 'error' => $error]);
    }

    #[Route(path: '/login/staff', name: 'app_login_staff')]
    public function loginStaff(AuthenticationUtils $authenticationUtils): Response
    {
        $error = $authenticationUtils->getLastAuthenticationError();
        $lastUsername = $authenticationUtils->getLastUsername();

        return $this->render('security/login_staff.html.twig', ['last_username' => $lastUsername, 'error' => $error]);
    }

    #[Route(path: '/forgot-password', name: 'app_forgot_password')]
    public function forgotPassword(): Response
    {
        return $this->render('security/forgot_password.html.twig');
    }

    #[Route(path: '/api/login', name: 'app_api_login', methods: ['POST'])]
    public function apiLogin(): void
    {
        // Intercepted by AppCustomAuthenticator
    }

    #[Route(path: '/api/forgot-password', name: 'app_api_forgot_password', methods: ['POST'])]
    public function apiForgotPassword(\Symfony\Component\HttpFoundation\Request $request): Response
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Veuillez entrer une adresse email valide.'
            ], 400);
        }

        // In a real application, you would generate a token, save it, and send a reset email.
        return new \Symfony\Component\HttpFoundation\JsonResponse([
            'status' => 'success',
            'message' => 'Un email de réinitialisation a été envoyé avec succès.'
        ]);
    }

    #[Route(path: '/api/reset-password/change', name: 'app_api_reset_password_change', methods: ['POST'])]
    public function apiResetPasswordChange(\Symfony\Component\HttpFoundation\Request $request): Response
    {
        $data = json_decode($request->getContent(), true);
        $password = $data['password'] ?? null;
        $confirmPassword = $data['confirm_password'] ?? null;

        if (!$password || strlen($password) < 6) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Le mot de passe doit comporter au moins 6 caractères.'
            ], 400);
        }

        if ($password !== $confirmPassword) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Les mots de passe ne correspondent pas.'
            ], 400);
        }

        // In a real application, you would update the user's password in the database.
        return new \Symfony\Component\HttpFoundation\JsonResponse([
            'status' => 'success',
            'message' => 'Votre mot de passe a été réinitialisé avec succès.'
        ]);
    }

    #[Route(path: '/api/me', name: 'app_api_me', methods: ['GET'])]
    public function me(): Response
    {
        $user = $this->getUser();
        if (!$user) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'authenticated' => false
            ], Response::HTTP_UNAUTHORIZED);
        }

        return new \Symfony\Component\HttpFoundation\JsonResponse([
            'authenticated' => true,
            'user' => [
                'email' => $user->getUserIdentifier(),
                'roles' => $user->getRoles(),
            ]
        ]);
    }

    #[Route(path: '/api/logout', name: 'app_api_logout', methods: ['POST', 'GET'])]
    public function apiLogout(\Symfony\Component\HttpFoundation\Request $request): Response
    {
        if ($request->hasSession()) {
            $request->getSession()->invalidate();
        }
        $response = new \Symfony\Component\HttpFoundation\JsonResponse([
            'success' => true,
            'message' => 'Déconnexion réussie.'
        ]);
        $response->headers->clearCookie('AUTH_SESSION', '/');
        $response->headers->clearCookie('PHPSESSID', '/');
        return $response;
    }

    #[Route(path: '/logout', name: 'app_logout')]
    public function logout(): void
    {
        throw new \LogicException('This method can be blank - it will be intercepted by the logout key on your firewall.');
    }
}
