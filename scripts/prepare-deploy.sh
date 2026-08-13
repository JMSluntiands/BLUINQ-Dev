#!/usr/bin/env bash
# Build a live update archive that does NOT include storage uploads or .env.
# Usage (Git Bash):
#   bash scripts/prepare-deploy.sh
#   bash scripts/prepare-deploy.sh --no-vendor
#   bash scripts/prepare-deploy.sh --skip-build
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WITH_VENDOR=1
SKIP_BUILD=0
for arg in "$@"; do
    case "$arg" in
        --no-vendor) WITH_VENDOR=0 ;;
        --skip-build) SKIP_BUILD=1 ;;
        -h|--help)
            sed -n '2,8p' "$0"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg" >&2
            exit 1
            ;;
    esac
done

if [[ "$SKIP_BUILD" -eq 0 ]]; then
    echo "==> npm run build"
    npm run build
fi

STAMP="$(date +%Y%m%d-%H%M)"
DIST="$ROOT/dist"
STAGE="$DIST/staging"
mkdir -p "$DIST"
rm -rf "$STAGE"
mkdir -p "$STAGE"

copy_tree() {
    local src="$1"
    local dest="$2"
    mkdir -p "$dest"
    cp -a "$src/." "$dest/"
}

echo "==> staging code (no storage uploads, no .env)"

for dir in app bootstrap config database resources routes; do
    copy_tree "$ROOT/$dir" "$STAGE/$dir"
done

# Keep public assets + entry files, never public/storage or public/hot
mkdir -p "$STAGE/public"
find "$ROOT/public" -maxdepth 1 -type f ! -name 'hot' -print0 \
    | while IFS= read -r -d '' file; do
        cp -a "$file" "$STAGE/public/"
    done
copy_tree "$ROOT/public/build" "$STAGE/public/build"

# Empty storage skeleton only — no uploaded images
mkdir -p \
    "$STAGE/storage/app/private" \
    "$STAGE/storage/app/public" \
    "$STAGE/storage/framework/cache/data" \
    "$STAGE/storage/framework/sessions" \
    "$STAGE/storage/framework/testing" \
    "$STAGE/storage/framework/views" \
    "$STAGE/storage/logs"
cp -a "$ROOT/storage/app/.gitignore" "$STAGE/storage/app/.gitignore"
cp -a "$ROOT/storage/app/private/.gitignore" "$STAGE/storage/app/private/.gitignore"
cp -a "$ROOT/storage/app/public/.gitignore" "$STAGE/storage/app/public/.gitignore"
cp -a "$ROOT/storage/framework/.gitignore" "$STAGE/storage/framework/.gitignore"
cp -a "$ROOT/storage/framework/cache/.gitignore" "$STAGE/storage/framework/cache/.gitignore"
cp -a "$ROOT/storage/framework/cache/data/.gitignore" "$STAGE/storage/framework/cache/data/.gitignore"
cp -a "$ROOT/storage/framework/sessions/.gitignore" "$STAGE/storage/framework/sessions/.gitignore"
cp -a "$ROOT/storage/framework/testing/.gitignore" "$STAGE/storage/framework/testing/.gitignore"
cp -a "$ROOT/storage/framework/views/.gitignore" "$STAGE/storage/framework/views/.gitignore"
cp -a "$ROOT/storage/logs/.gitignore" "$STAGE/storage/logs/.gitignore"

# Do not ship live SQL dumps
rm -rf "$STAGE/database/sql"

for file in artisan composer.json composer.lock; do
    cp -a "$ROOT/$file" "$STAGE/$file"
done

if [[ "$WITH_VENDOR" -eq 1 ]]; then
    if [[ -d "$ROOT/vendor" ]]; then
        echo "==> including vendor"
        copy_tree "$ROOT/vendor" "$STAGE/vendor"
    else
        echo "warning: vendor/ missing; run composer install, or use --no-vendor" >&2
    fi
fi

# Safety: never pack live secrets or uploads even if copy rules change
rm -f "$STAGE/.env" "$STAGE/.env.backup" "$STAGE/.env.production" "$STAGE/public/hot"
rm -rf "$STAGE/public/storage"

ARCHIVE="$DIST/bluinq-deploy-$STAMP.zip"
echo "==> writing $ARCHIVE"

pack_zip() {
    if command -v zip >/dev/null 2>&1; then
        (cd "$STAGE" && zip -r -q "$ARCHIVE" .)
        return
    fi

    powershell.exe -NoProfile -Command \
        "Compress-Archive -Path '$STAGE\*' -DestinationPath '$ARCHIVE' -Force"
}

pack_zip
rm -rf "$STAGE"

echo
echo "Ready: $ARCHIVE"
echo
echo "BEFORE upload on live:"
echo "  1. Zip/download  storage/app/public   (logo, profiles, announcements)"
echo "  2. Do NOT delete the live app folder"
echo "  3. Extract OVER existing files"
echo "  4. Skip / do not overwrite  storage/app/public  and  .env"
echo "  5. If images vanish, restore the backup from step 1"
echo
echo "See DEPLOY.md for the full checklist."
