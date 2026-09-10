#!/bin/sh
php artisan config:cache
php artisan route:cache
php artisan migrate --force --seed
exec apache2-foreground # o kung ano man ang web server command mo