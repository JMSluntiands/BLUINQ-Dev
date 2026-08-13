# Live deploy (keep images)

Uploads live in `storage/app/public/` (logo, profile photos, announcements).
That folder is **not** in git. Overwriting it on live deletes the images.

## Never touch on live

- `storage/app/public/`
- `public/storage`
- `.env`

## Safest: git pull on the server

```bash
cd /path/to/bluinq
php artisan down
git pull origin develop
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link
php artisan up
```

`git pull` does not delete live uploads. Do **not** run `git clean`.

## FTP / File Manager / zip

1. On live, zip/download `storage/app/public` first (backup).
2. From Git Bash on your PC:

   ```bash
   bash scripts/prepare-deploy.sh
   ```

   Output: `dist/bluinq-deploy-YYYYMMDD-HHMM.zip`  
   (`--no-vendor` if live already has `vendor` and you will run composer there)

3. Extract **over** the existing live app. Do not delete the live folder first.
4. Skip overwrite of `storage/app/public` and `.env`.
5. If the host uses a `public_html` document root, upload `public/build` into that `public` folder only — still leave `storage` alone.

WinSCP / rsync exclude list: `deploy-exclude.txt`

## After deploy

- Confirm logo + a profile photo still load.
- If images are gone, restore the `storage/app/public` backup. Do not re-upload your local `storage` folder.
