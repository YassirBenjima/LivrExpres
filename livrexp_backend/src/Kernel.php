<?php

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function getCacheDir(): string
    {
        if ($this->isRunningInDocker()) {
            return '/tmp/livrexpress/cache/' . $this->getEnvironment();
        }

        return parent::getCacheDir();
    }

    public function getLogDir(): string
    {
        if ($this->isRunningInDocker()) {
            return '/tmp/livrexpress/log';
        }

        return parent::getLogDir();
    }

    private function isRunningInDocker(): bool
    {
        return file_exists('/.dockerenv') || getenv('DOCKER_CONTAINER') !== false;
    }
}
