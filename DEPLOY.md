# Live deploy (keep images)

Hostinger Git OAuth **replaces the deploy folder** (`public_html`) on every push.
Uploads in `storage/` are not in git, so they get wiped. Move storage **outside** `public_html`.

## Hostinger Git OAuth (one-time)

Do this once on live. After that, normal `develop` deploys will not delete images.

### A. If you have SSH / Terminal

```bash
cd ~/domains/YOURDOMAIN/public_html
php artisan bluinq:persist-storage
```

That copies logo, profile photos, announcements, and memo files to:

`~/domains/YOURDOMAIN/persistent/storage`

and writes `APP_STORAGE_PATH` to `.env` plus a sidecar file **outside** `public_html`.

### B. File Manager only

1. Go **up** from `public_html` to the domain folder.
2. Create `persistent/storage`.
3. Move (cut) these from `public_html/storage` into `persistent/storage`:
   - `app/public` (logo, profile-images, announcement-images, …)
   - `app/private` (drafting memo attachments)
   - `logs`, `framework` (optional but recommended)
4. Edit live `.env` and add the real path, for example:

```
APP_STORAGE_PATH=/home/u123456789/domains/YOURDOMAIN/persistent/storage
```

Find `/home/u…` under hPanel → Advanced → SSH Access, or from File Manager path.

5. Create a text file **next to** `public_html` named `.bluinq-storage-path` with that same path (one line). This survives even if `.env` is reset.

6. Deploy / reload PHP, then check logo + a profile photo.

## After that: normal Git deploy

Push `develop` as usual. Do **not** put uploads back inside `public_html/storage`.

If images are already gone, restore a backup into `persistent/storage/app/public`, not into `public_html`.

## FTP / zip (not Hostinger Git)

Use `bash scripts/prepare-deploy.sh` and never overwrite `storage/` or `.env`.
Exclude list: `deploy-exclude.txt`.
