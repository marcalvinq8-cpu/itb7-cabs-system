#!/bin/bash

echo "Running migrations..."
php artisan migrate --force

echo "Running database seeders..."
php artisan db:seed --force

echo "Starting Apache..."
exec apache2-foreground