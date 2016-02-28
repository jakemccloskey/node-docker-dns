FROM node:4.3.1-slim

RUN mkdir -p /opt/app
WORKDIR /opt/app

RUN apt-get update -yq && apt-get install -yq supervisor dnsmasq \
    && mkdir -p /var/log/supervisor && touch /etc/dnsmasq.d/hosts \
    && rm -rf /tmp/* && apt-get autoremove -y

COPY package.json /tmp/package.json
COPY npm-shrinkwrap.json /tmp/npm-shrinkwrap.json
RUN cd /tmp && npm install --silent \
    && cp -a /tmp/node_modules /opt/app/ \
    && rm -rf /tmp/*

COPY supervisord.prod.conf /etc/supervisor/conf.d/supervisord.conf

COPY . /opt/app

RUN npm run gulp build && npm prune --production --silent

EXPOSE 53/udp

CMD ["/usr/bin/supervisord"]
