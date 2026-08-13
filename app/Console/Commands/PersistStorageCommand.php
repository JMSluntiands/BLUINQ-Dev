<?php

namespace App\Console\Commands;

use App\Support\PersistentStoragePath;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class PersistStorageCommand extends Command
{
    protected $signature = 'bluinq:persist-storage
                            {path? : Target storage path outside the Git deploy folder}
                            {--move : Move files instead of copy}';

    protected $description = 'Move Laravel storage outside public_html so Hostinger Git deploys do not wipe uploads';

    public function handle(): int
    {
        $basePath = base_path();
        $source = $basePath.DIRECTORY_SEPARATOR.'storage';
        $target = $this->argument('path') ?: PersistentStoragePath::recommended($basePath);
        $target = rtrim($target, "\\/");

        $this->info('App storage (inside Git deploy): '.$source);
        $this->info('Persistent storage (outside deploy): '.$target);

        if ($this->pathsMatch($source, $target)) {
            $this->error('Target cannot be the Git deploy storage folder.');

            return self::FAILURE;
        }

        PersistentStoragePath::ensureDirectories($target);

        $copied = $this->copyStorage($source, $target, (bool) $this->option('move'));
        $this->info($this->option('move') ? "Moved {$copied} items." : "Copied {$copied} items.");

        $this->writeConfig($basePath, $target);

        $this->newLine();
        $this->info('Add this to live .env if it is not there yet:');
        $this->line('APP_STORAGE_PATH='.$target);
        $this->newLine();
        $this->warn('Do not store uploads inside public_html. Hostinger Git OAuth replaces that folder on every deploy.');

        return self::SUCCESS;
    }

    private function copyStorage(string $from, string $to, bool $move): int
    {
        $copied = 0;

        if (! is_dir($from)) {
            return 0;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($from, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        );

        /** @var \SplFileInfo $item */
        foreach ($iterator as $item) {
            $relative = substr($item->getPathname(), strlen($from));
            $destination = $to.$relative;

            if ($item->isDir()) {
                File::ensureDirectoryExists($destination);
                continue;
            }

            File::ensureDirectoryExists(dirname($destination));
            if ($move) {
                File::move($item->getPathname(), $destination);
            } else {
                File::copy($item->getPathname(), $destination);
            }
            $copied++;
        }

        return $copied;
    }

    private function writeConfig(string $basePath, string $target): void
    {
        $sidecar = PersistentStoragePath::preferredSidecar($basePath);
        PersistentStoragePath::writeSidecar($sidecar, $target);
        $this->info('Wrote sidecar: '.$sidecar);

        $envFile = $basePath.DIRECTORY_SEPARATOR.'.env';
        if (! is_file($envFile) || ! is_writable($envFile)) {
            $this->warn('Could not update .env automatically. Add APP_STORAGE_PATH manually.');

            return;
        }

        $contents = (string) file_get_contents($envFile);
        if (preg_match('/^APP_STORAGE_PATH\s*=/m', $contents)) {
            $contents = preg_replace(
                '/^APP_STORAGE_PATH\s*=.*$/m',
                'APP_STORAGE_PATH='.$target,
                $contents,
                1,
            );
        } else {
            $contents = rtrim($contents).PHP_EOL.PHP_EOL.'APP_STORAGE_PATH='.$target.PHP_EOL;
        }

        file_put_contents($envFile, $contents);
        $this->info('Updated .env APP_STORAGE_PATH.');
    }

    private function pathsMatch(string $left, string $right): bool
    {
        return rtrim(str_replace('\\', '/', $left), '/') === rtrim(str_replace('\\', '/', $right), '/');
    }
}
