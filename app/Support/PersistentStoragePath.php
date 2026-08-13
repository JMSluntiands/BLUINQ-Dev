<?php

namespace App\Support;

class PersistentStoragePath
{
    public const SIDECAR = '.bluinq-storage-path';

    /**
     * @return list<string>
     */
    public static function requiredDirectories(): array
    {
        return [
            'app/public',
            'app/private',
            'framework/cache/data',
            'framework/sessions',
            'framework/testing',
            'framework/views',
            'logs',
        ];
    }

    public static function resolve(string $basePath): ?string
    {
        $candidates = [
            $_ENV['APP_STORAGE_PATH'] ?? null,
            $_SERVER['APP_STORAGE_PATH'] ?? null,
            getenv('APP_STORAGE_PATH') ?: null,
            self::readEnvValue($basePath.DIRECTORY_SEPARATOR.'.env', 'APP_STORAGE_PATH'),
        ];

        foreach (self::sidecarCandidates($basePath) as $sidecar) {
            $candidates[] = self::readSidecar($sidecar);
        }

        foreach ($candidates as $path) {
            if (! is_string($path)) {
                continue;
            }

            $path = trim($path);
            if ($path === '') {
                continue;
            }

            return rtrim($path, "\\/");
        }

        return null;
    }

    public static function recommended(string $basePath): string
    {
        $normalized = str_replace('\\', '/', rtrim($basePath, "\\/"));

        // public_html/dev → public_html/persistent-dev/storage
        // Stays inside public_html (Hostinger open_basedir) but outside the Git deploy folder.
        if (preg_match('#^(.*?/public_html)/([^/]+)$#', $normalized, $matches) === 1) {
            return $matches[1].'/persistent-'.$matches[2].'/storage';
        }

        if (str_ends_with($normalized, '/public_html')) {
            return dirname($normalized).'/persistent/storage';
        }

        return dirname($basePath).DIRECTORY_SEPARATOR.'persistent'.DIRECTORY_SEPARATOR.'storage';
    }

    /**
     * @return list<string>
     */
    public static function sidecarCandidates(string $basePath): array
    {
        $candidates = [
            $basePath.DIRECTORY_SEPARATOR.self::SIDECAR,
            dirname($basePath).DIRECTORY_SEPARATOR.self::SIDECAR,
        ];

        $normalized = str_replace('\\', '/', rtrim($basePath, "\\/"));
        if (preg_match('#^(.*?)/public_html(?:/.*)?$#', $normalized, $matches) === 1) {
            $candidates[] = str_replace('/', DIRECTORY_SEPARATOR, $matches[1].'/'.self::SIDECAR);
        }

        return array_values(array_unique($candidates));
    }

    public static function preferredSidecar(string $basePath): string
    {
        $normalized = str_replace('\\', '/', rtrim($basePath, "\\/"));
        if (preg_match('#^(.*?/public_html)/([^/]+)$#', $normalized, $matches) === 1) {
            return str_replace('/', DIRECTORY_SEPARATOR, $matches[1].'/'.self::SIDECAR);
        }

        return dirname($basePath).DIRECTORY_SEPARATOR.self::SIDECAR;
    }

    public static function ensureDirectories(string $storagePath): void
    {
        foreach (self::requiredDirectories() as $relative) {
            $dir = $storagePath.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative);
            if (! is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
        }
    }

    public static function writeSidecar(string $sidecarFile, string $storagePath): void
    {
        $dir = dirname($sidecarFile);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents($sidecarFile, $storagePath.PHP_EOL);
    }

    private static function readSidecar(string $file): ?string
    {
        if (! is_file($file) || ! is_readable($file)) {
            return null;
        }

        $value = trim((string) file_get_contents($file));

        return $value !== '' ? $value : null;
    }

    private static function readEnvValue(string $file, string $key): ?string
    {
        if (! is_file($file) || ! is_readable($file)) {
            return null;
        }

        $lines = file($file, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            return null;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (! preg_match('/^'.preg_quote($key, '/').'\s*=\s*(.*)$/', $line, $matches)) {
                continue;
            }

            $value = trim($matches[1]);
            if ($value === '') {
                return null;
            }

            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"'))
                || (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }

            return $value !== '' ? $value : null;
        }

        return null;
    }
}
