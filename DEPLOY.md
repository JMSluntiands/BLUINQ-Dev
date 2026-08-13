# Live deploy (keep images)

Hostinger Git OAuth **replaces** `public_html/dev` on every push. Files inside that folder’s `storage/` are deleted.

The app now auto-saves uploads to:

`public_html/persistent-dev/storage`

(sibling of `dev`, still inside `public_html`). The brand logo is also in `public/logo.png` so it ships with Git.

## Hostinger Git setting (important)

Deploy directory must be **`public_html/dev`**, not all of `public_html`.

If Git deploys to the whole `public_html`, even `persistent-dev` gets wiped.

## After this deploy

1. Redeploy / wait for auto-deploy.
2. Open `https://dev.bluinq.net` once (creates `persistent-dev` if needed).
3. Put `logo.png` back if it was already deleted (File Manager → `public/logo.png` **or** `persistent-dev/storage/app/public/logo.png`).
4. Hard refresh login.

Do **not** keep uploads only in `public_html/dev/storage` — that folder is erased on the next push.

Optional SSH one-time copy:

```bash
cd ~/domains/bluinq.net/public_html/dev
php artisan bluinq:persist-storage
```

## FTP / zip

Use `bash scripts/prepare-deploy.sh` and never overwrite `storage/` or `.env`.
Exclude list: `deploy-exclude.txt`.
