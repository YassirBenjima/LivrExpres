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
    public function apiLogin(
        \Symfony\Component\HttpFoundation\Request $request,
        \App\Repository\UserRepository $userRepository,
        \Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface $passwordHasher
    ): Response {
        $content = $request->getContent();
        $data = json_decode($content, true);
        if (!is_array($data)) {
            try {
                $data = $request->toArray();
            } catch (\Throwable $e) {
                $data = $request->request->all();
            }
        }
        $email = trim($data['username'] ?? $data['email'] ?? $data['_username'] ?? '');
        $password = $data['password'] ?? $data['_password'] ?? '';

        if (!$email || !$password) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'error' => 'Veuillez saisir un email et un mot de passe.'
            ], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findOneBy(['email' => $email]);

        if (!$user || !$passwordHasher->isPasswordValid($user, $password)) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'error' => 'Identifiants invalides.'
            ], Response::HTTP_UNAUTHORIZED);
        }

        if ($request->hasSession()) {
            $session = $request->getSession();
            $token = new \Symfony\Component\Security\Http\Authenticator\Token\PostAuthenticationToken(
                $user,
                'main',
                $user->getRoles()
            );
            $session->set('_security_main', serialize($token));
        }

        $response = new \Symfony\Component\HttpFoundation\JsonResponse([
            'success' => true,
            'user' => [
                'email' => $user->getUserIdentifier(),
                'roles' => $user->getRoles(),
            ],
            'redirect' => '/dashboard'
        ]);

        $rememberMe = !empty($data['_remember_me']) || !empty($data['remember_me']) || !empty($data['remember']);
        $cookieLifetime = $rememberMe ? (time() + (86400 * 30)) : 0;

        $authCookie = \Symfony\Component\HttpFoundation\Cookie::create(
            'AUTH_SESSION',
            base64_encode($user->getUserIdentifier() . ':' . time()),
            $cookieLifetime,
            '/',
            null,
            false,
            true,
            false,
            \Symfony\Component\HttpFoundation\Cookie::SAMESITE_LAX
        );
        $response->headers->setCookie($authCookie);

        return $response;
    }

    #[Route(path: '/api/forgot-password', name: 'app_api_forgot_password', methods: ['POST'])]
    public function apiForgotPassword(\Symfony\Component\HttpFoundation\Request $request, \Symfony\Component\Mailer\MailerInterface $mailer): Response
    {
        $content = $request->getContent();
        $data = json_decode($content, true);
        if (!is_array($data)) {
            try {
                $data = $request->toArray();
            } catch (\Throwable $e) {
                $data = $request->request->all();
            }
        }
        $email = trim($data['email'] ?? '');

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Veuillez entrer une adresse email valide.'
            ], 400);
        }

        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        if ($request->hasSession()) {
            $request->getSession()->set('reset_code_' . strtolower($email), $code);
            $request->getSession()->set('reset_email_last', strtolower($email));
        }

        try {
            $emailMessage = (new \Symfony\Component\Mime\Email())
                ->from('no-reply@livrexpress.ma')
                ->to($email)
                ->subject('Code de vérification - Réinitialisation de votre mot de passe - LivrExpress')
                ->html('
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de votre mot de passe</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 40px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 148, 255, 0.08); border: 1px solid #e2e8f0;">
                    
                    <!-- Top Gradient Header Bar -->
                    <tr>
                        <td style="height: 6px; background: linear-gradient(90deg, #0094FF 0%, #0056B3 100%);"></td>
                    </tr>

                    <!-- Header Logo & Branding -->
                    <tr>
                        <td style="padding: 32px 40px 24px 40px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                                <tr>
                                    <td style="vertical-align: middle;">
                                        <svg width="120" height="22" viewBox="0 0 136 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M25.3479 2.07227L30.9247 19.2221C31.345 20.5144 30.3817 21.8406 29.0227 21.8406H25.4501C24.143 21.8406 22.9864 20.9943 22.5908 19.7485L17.313 3.12631C16.8216 1.57872 17.9767 0 19.6004 0H22.4949C23.7943 0 24.946 0.836549 25.3479 2.07227Z" fill="#0094FF"/>
                                            <path d="M18.4585 14.5335L14.4 1.53388C14.1152 0.621383 13.2702 0 12.3143 0C11.3835 0 10.6159 0.729443 10.5685 1.65907L10.0856 11.1365C10.0391 12.0484 10.1491 12.9616 10.4108 13.8364L12.3784 20.4138C12.6317 21.2605 13.4107 21.8406 14.2945 21.8406H15.8075C16.678 21.8406 17.4485 21.2775 17.713 20.4481L18.4476 18.1442C18.8218 16.9703 18.8257 15.7096 18.4585 14.5335Z" fill="#0f172a"/>
                                            <path d="M9.14023 0H12.2457C13.864 0 15.0184 1.56893 14.537 3.11397L9.30895 19.8925C8.91833 21.1461 7.75784 22 6.44477 22H2.91162C1.56816 22 0.606758 20.7018 0.998564 19.4167L6.27065 2.12509C6.65557 0.862609 7.82038 0 9.14023 0Z" fill="#0094FF"/>
                                        </svg>
                                    </td>
                                    <td style="vertical-align: middle; padding-left: 8px;">
                                        <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">LivrExpress</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 40px;">
                            
                            <!-- Security Shield Icon -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; width: 64px; height: 64px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 50%; text-align: center; line-height: 64px;">
                                    <span style="font-size: 28px;">🔐</span>
                                </div>
                            </div>

                            <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; text-align: center; letter-spacing: -0.3px;">
                                Code de vérification
                            </h1>

                            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #475569; text-align: center;">
                                Bonjour,
                            </p>

                            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #475569; text-align: center;">
                                Nous avons reçu une demande de réinitialisation du mot de passe pour le compte <strong>' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '</strong>.
                            </p>

                            <!-- 6-digit Code Box -->
                            <div style="text-align: center; margin: 24px 0 28px 0;">
                                <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Votre code à 6 chiffres</p>
                                <div style="display: inline-block; background-color: #f0f9ff; border: 2px dashed #0094FF; border-radius: 12px; padding: 14px 28px; letter-spacing: 10px; font-size: 32px; font-weight: 800; color: #0094FF; font-family: monospace;">
                                    ' . $code . '
                                </div>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-bottom: 32px;">
                                <a href="http://localhost:5173/reset-password/change" style="background: linear-gradient(135deg, #0094FF 0%, #0072CE 100%); color: #ffffff; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(0, 148, 255, 0.35);">
                                    Saisir le code et réinitialiser
                                </a>
                            </div>

                            <!-- Security Notice Box -->
                            <div style="background-color: #f8fafc; border-left: 4px solid #0094FF; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="font-size: 13px; line-height: 20px; color: #64748b;">
                                            🛡️ <strong>Sécurité :</strong> Ne partagez ce code avec personne. Si vous n\'êtes pas à l\'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Direct Link Fallback -->
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; text-align: center;">
                                Ou utilisez ce lien direct :
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #0094FF; word-break: break-all; text-align: center;">
                                <a href="http://localhost:5173/reset-password/change" style="color: #0094FF; text-decoration: underline;">http://localhost:5173/reset-password/change</a>
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                                LivrExpress — Solution Logistique & Transport
                            </p>
                            <p style="margin: 0 0 12px 0; font-size: 11px; color: #94a3b8;">
                                Cet e-mail automatique vous a été envoyé pour des raisons de sécurité. Merci de ne pas y répondre directement.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                                © 2026 LivrExpress Inc. Tous droits réservés.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
                ');

            $mailer->send($emailMessage);
        } catch (\Throwable $e) {
            // Silence exception so response is consistent
        }

        return new \Symfony\Component\HttpFoundation\JsonResponse([
            'status' => 'success',
            'message' => 'Un e-mail de réinitialisation avec votre code à 6 chiffres a été envoyé avec succès.'
        ]);
    }

    #[Route(path: '/api/reset-password/change', name: 'app_api_reset_password_change', methods: ['POST'])]
    public function apiResetPasswordChange(\Symfony\Component\HttpFoundation\Request $request, \App\Repository\UserRepository $userRepository, \Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface $passwordHasher, \Doctrine\ORM\EntityManagerInterface $em): Response
    {
        $content = $request->getContent();
        $data = json_decode($content, true);
        if (!is_array($data)) {
            try {
                $data = $request->toArray();
            } catch (\Throwable $e) {
                $data = $request->request->all();
            }
        }

        $code = trim((string)($data['code'] ?? ''));
        $password = (string)($data['password'] ?? '');
        $confirmPassword = (string)($data['confirm_password'] ?? '');
        $email = trim((string)($data['email'] ?? ''));

        if (!$email && $request->hasSession()) {
            $email = (string) $request->getSession()->get('reset_email_last', '');
        }

        if (strlen($code) !== 6) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Le code de vérification doit comporter exactement 6 chiffres.'
            ], 400);
        }

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

        if (!$email) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Adresse e-mail introuvable. Veuillez recommencer la procédure.'
            ], 400);
        }

        $user = $userRepository->findOneBy(['email' => $email]);
        if (!$user) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'status' => 'error',
                'message' => 'Aucun compte associé à cette adresse e-mail.'
            ], 404);
        }

        if ($request->hasSession()) {
            $expectedCode = $request->getSession()->get('reset_code_' . strtolower($email));
            if ($expectedCode && $code !== $expectedCode) {
                return new \Symfony\Component\HttpFoundation\JsonResponse([
                    'status' => 'error',
                    'message' => 'Code de vérification incorrect. Veuillez vérifier le code reçu par e-mail.'
                ], 400);
            }
        }

        // Hash and save new password
        $user->setPassword($passwordHasher->hashPassword($user, $password));
        $em->flush();

        if ($request->hasSession()) {
            $request->getSession()->remove('reset_code_' . strtolower($email));
        }

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
