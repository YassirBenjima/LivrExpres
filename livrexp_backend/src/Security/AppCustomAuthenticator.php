<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractLoginFormAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\CsrfTokenBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Credentials\PasswordCredentials;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\SecurityRequestAttributes;
use Symfony\Component\Security\Http\Util\TargetPathTrait;

class AppCustomAuthenticator extends AbstractLoginFormAuthenticator
{
    use TargetPathTrait;

    public const LOGIN_ROUTE = 'app_login';
    public const LOGIN_STAFF_ROUTE = 'app_login_staff';

    private UrlGeneratorInterface $urlGenerator;

    public function __construct(UrlGeneratorInterface $urlGenerator)
    {
        $this->urlGenerator = $urlGenerator;
    }

    public function supports(Request $request): bool
    {
        return $request->isMethod('POST') && (
            $this->urlGenerator->generate(self::LOGIN_ROUTE) === $request->getRequestUri() ||
            $this->urlGenerator->generate(self::LOGIN_STAFF_ROUTE) === $request->getRequestUri()
        );
    }

    public function authenticate(Request $request): Passport
    {
        if (str_contains($request->headers->get('Content-Type', ''), 'application/json')) {
            $content = $request->getContent();
            $data = json_decode($content, true);
            if (!is_array($data)) {
                $data = [];
            }
            $email = $data['username'] ?? $data['_username'] ?? $data['email'] ?? '';
            $password = $data['password'] ?? $data['_password'] ?? '';

            return new Passport(
                new UserBadge($email),
                new PasswordCredentials($password)
            );
        }

        $email = $request->request->get('_username', '');

        $request->getSession()->set(SecurityRequestAttributes::LAST_USERNAME, $email);

        return new Passport(
            new UserBadge($email),
            new PasswordCredentials($request->request->get('_password', '')),
            [
                new CsrfTokenBadge('authenticate', $request->request->get('_csrf_token')),
            ]
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        if (str_contains($request->headers->get('Content-Type', ''), 'application/json') || str_starts_with($request->getPathInfo(), '/api/')) {
            $user = $token->getUser();
            $response = new \Symfony\Component\HttpFoundation\JsonResponse([
                'success' => true,
                'user' => [
                    'email' => $user->getUserIdentifier(),
                    'roles' => $user->getRoles(),
                ],
                'redirect' => '/dashboard'
            ]);

            // Set secure HttpOnly cookie (XSS-protected: cannot be read or stolen by JavaScript)
            $authCookie = \Symfony\Component\HttpFoundation\Cookie::create(
                'AUTH_SESSION',
                base64_encode($user->getUserIdentifier() . ':' . time()),
                time() + (86400 * 7), // 7 days
                '/',
                null,
                false, // Secure (set to true in HTTPS production)
                true,  // HttpOnly = TRUE (XSS Protection)
                false,
                \Symfony\Component\HttpFoundation\Cookie::SAMESITE_LAX
            );
            $response->headers->setCookie($authCookie);

            return $response;
        }

        if ($targetPath = $this->getTargetPath($request->getSession(), $firewallName)) {
            // return new RedirectResponse($targetPath);
        }

        // Default redirect
        return new RedirectResponse($this->urlGenerator->generate('app_dashboard'));
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        if (str_contains($request->headers->get('Content-Type', ''), 'application/json') || str_starts_with($request->getPathInfo(), '/api/')) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'error' => strtr($exception->getMessageKey(), $exception->getMessageData())
            ], Response::HTTP_UNAUTHORIZED);
        }

        return parent::onAuthenticationFailure($request, $exception);
    }

    public function start(Request $request, ?AuthenticationException $authException = null): Response
    {
        if (str_contains($request->headers->get('Accept', ''), 'application/json') || str_contains($request->headers->get('Content-Type', ''), 'application/json') || str_starts_with($request->getPathInfo(), '/api/')) {
            return new \Symfony\Component\HttpFoundation\JsonResponse([
                'error' => 'Non authentifié. Veuillez vous connecter.'
            ], Response::HTTP_UNAUTHORIZED);
        }

        return parent::start($request, $authException);
    }

    protected function getLoginUrl(Request $request): string
    {
        $pathInfo = $request->getPathInfo();
        
        // If the request was made on the /login/staff page, format the fallback to the staff login
        if ($pathInfo === '/login/staff' || str_starts_with($pathInfo, '/staff')) {
            return $this->urlGenerator->generate(self::LOGIN_STAFF_ROUTE);
        }

        return $this->urlGenerator->generate(self::LOGIN_ROUTE);
    }
}
