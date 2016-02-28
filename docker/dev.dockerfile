FROM node:4.3.1-slim

RUN mkdir -p /opt/app
WORKDIR /opt/app

RUN apt-get update -yq && apt-get install -yq supervisor dnsmasq \
    && mkdir -p /var/log/supervisor && touch /etc/dnsmasq.d/hosts \
    && rm -rf /tmp/* && apt-get autoremove -y

COPY supervisord.dev.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 53/udp

CMD ["/usr/bin/supervisord"]
