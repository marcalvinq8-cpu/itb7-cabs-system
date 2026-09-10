FROM php:8.2-fpm

# Install system dependencies & PHP extensions for MySQL
RUN apt-get update && apt-get install -y \
    git unzip libpng-dev libonig-dev libxml2-dev zip curl \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

WORKDIR /var/www

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy project files
COPY . /var/www

# Isama ang dev dependencies (para gumana ang Faker sa Seeders)
RUN composer install --optimize-autoloader

# Storage & Cache permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

EXPOSE 8000

# Entrypoint script: Gamitin ang migrate:fresh para maiwasan ang duplicate keys
CMD php artisan config:clear && php artisan migrate:fresh --seed --force && php artisan serve --host=0.0.0.0 --port=8000