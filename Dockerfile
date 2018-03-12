FROM nickistre/ubuntu-lamp

RUN rm -rf /var/www/html/index.html

ADD  site /var/www/html/

RUN chown www-data:www-data /var/www/html/* -R

RUN a2enmod rewrite

RUN service apache2 restart

EXPOSE 80
