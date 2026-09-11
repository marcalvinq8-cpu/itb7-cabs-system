#!/bin/sh
php artisan config:cache
php artisan route:cache
php artisan migrate --force
exec apache2-foreground