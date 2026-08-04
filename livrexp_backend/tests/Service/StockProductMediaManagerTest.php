<?php

namespace App\Tests\Service;

use App\Service\StockProductMediaManager;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class StockProductMediaManagerTest extends TestCase
{
    private string $tempDir;
    private string $photoDir;
    private string $qrDir;
    private StockProductMediaManager $manager;

    protected function setUp(): void
    {
        $this->tempDir = sys_get_temp_dir() . '/test_media_mgr_' . uniqid();
        $this->photoDir = $this->tempDir . '/uploads/stock-products';
        $this->qrDir = $this->tempDir . '/uploads/stock-products-qr';

        mkdir($this->photoDir, 0777, true);
        mkdir($this->qrDir, 0777, true);

        $this->manager = new StockProductMediaManager($this->tempDir, $this->photoDir, $this->qrDir);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->tempDir);
    }

    public function testGenerateProductQrPngCreatesFileAndReturnsPath(): void
    {
        if (!extension_loaded('gd')) {
            $this->markTestSkipped('L\'extension PHP GD n\'est pas activée sur ce CLI PHP.');
        }

        $relativePath = $this->manager->generateProductQrPng('PROD-12345');

        $this->assertStringStartsWith('uploads/stock-products-qr/qr-product-', $relativePath);
        $this->assertStringEndsWith('.png', $relativePath);

        $expectedFile = $this->tempDir . '/' . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
        $this->assertFileExists($expectedFile);
    }

    public function testDeletePublicFileSafelyIgnoresNullOrEmptyPath(): void
    {
        $this->manager->deletePublicFileSafely(null);
        $this->manager->deletePublicFileSafely('');
        $this->assertTrue(true); // Did not throw or error
    }

    public function testDeletePublicFileSafelyPreventsPathTraversal(): void
    {
        $secretFile = $this->tempDir . '/secret.txt';
        file_put_contents($secretFile, 'secret content');

        $this->manager->deletePublicFileSafely('../secret.txt');
        $this->assertFileExists($secretFile);
    }

    public function testDeletePublicFileSafelyDeletesAllowedFile(): void
    {
        $publicSubdir = $this->tempDir . '/public/uploads/stock-products';
        mkdir($publicSubdir, 0777, true);

        $targetFile = $publicSubdir . '/product-test.jpg';
        file_put_contents($targetFile, 'dummy content');

        $this->manager->deletePublicFileSafely('uploads/stock-products/product-test.jpg');
        $this->assertFileDoesNotExist($targetFile);
    }

    private function removeDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $files = array_diff(scandir($dir) ?: [], ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
