<?php

namespace App\Tests\Service;

use App\Entity\BonLivraison;
use App\Service\BonLivraisonPdfGenerator;
use PHPUnit\Framework\TestCase;
use Twig\Environment;

class BonLivraisonPdfGeneratorTest extends TestCase
{
    private Environment $twig;
    private BonLivraisonPdfGenerator $generator;

    protected function setUp(): void
    {
        $this->twig = $this->createMock(Environment::class);
        $this->generator = new BonLivraisonPdfGenerator($this->twig, '/dummy/project/dir');
    }

    public function testBuildFilenameSanitizesReference(): void
    {
        $filename = $this->generator->buildFilename('BL/2026-0001#XYZ');
        $this->assertEquals('BL-2026-0001-XYZ.pdf', $filename);
    }

    public function testBuildFilenameFallsBackToBonPdfWhenEmpty(): void
    {
        $filename = $this->generator->buildFilename('!!!');
        $this->assertEquals('bon.pdf', $filename);
    }

    public function testGenerateDownloadResponseThrowsExceptionWhenReferenceIsEmpty(): void
    {
        $bon = new BonLivraison();
        $bon->setReference('');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Document non disponible');

        $this->generator->generateDownloadResponse($bon);
    }

    public function testGenerateDownloadResponseRendersPdfResponse(): void
    {
        $bon = new BonLivraison();
        $bon->setReference('BL-2026-001');
        $bon->setStatus('cree');

        $this->twig->expects($this->once())
            ->method('render')
            ->with('bon_livraison/pdf.html.twig', $this->anything())
            ->willReturn('<html><body><h1>Bon de livraison BL-2026-001</h1></body></html>');

        $response = $this->generator->generateDownloadResponse($bon);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('BL-2026-001.pdf', (string) $response->headers->get('Content-Disposition'));
    }
}
