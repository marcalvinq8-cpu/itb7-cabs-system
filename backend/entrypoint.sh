#!/bin/sh

# Burahe muna ang lumang storage link kung mayroon man
rm -rf public/storage

# Siguraduhin na nakakonekta ang public storage para sa mga images
php artisan storage:link --force

# I-clear at i-cache ang configurations
php artisan config:clear
php artisan config:cache
php artisan route:cache

# I-run ang database migrations
php artisan migrate --force

# Patakbuhin ang server
exec php artisan serve --host=0.0.0.0 --port=8000