<?php

namespace App\Tests\Service;

use App\Entity\ReturnRequest;
use App\Service\BonRetourPdfGenerator;
use PHPUnit\Framework\TestCase;
use Twig\Environment;

class BonRetourPdfGeneratorTest extends TestCase
{
    private Environment $twig;
    private BonRetourPdfGenerator $generator;

    protected function setUp(): void
    {
        $this->twig = $this->createMock(Environment::class);
        $this->generator = new BonRetourPdfGenerator($this->twig, '/dummy/project/dir');
    }

    public function testBuildFilenameSanitizesReference(): void
    {
        $filename = $this->generator->buildFilename('BR/2026-999');
        $this->assertEquals('BR-2026-999.pdf', $filename);
    }

    public function testBuildFilenameFallsBackToBonRetourPdfWhenEmpty(): void
    {
        $filename = $this->generator->buildFilename('***');
        $this->assertEquals('bon-retour.pdf', $filename);
    }

    public function testGenerateDownloadResponseThrowsExceptionWhenReferenceIsEmpty(): void
    {
        $demande = new ReturnRequest();
        $demande->setBonReference('');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Document non disponible');

        $this->generator->generateDownloadResponse($demande);
    }

    public function testGenerateDownloadResponseRendersPdfResponse(): void
    {
        $demande = new ReturnRequest();
        $demande->setBonReference('BR-2026-005');
        $demande->setStatus('pending');

        $this->twig->expects($this->once())
            ->method('render')
            ->with('retour/bons/pdf.html.twig', $this->anything())
            ->willReturn('<html><body><h1>Bon de retour BR-2026-005</h1></body></html>');

        $response = $this->generator->generateDownloadResponse($demande);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('BR-2026-005.pdf', (string) $response->headers->get('Content-Disposition'));
    }
}
