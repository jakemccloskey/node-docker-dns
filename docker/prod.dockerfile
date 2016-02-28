FROM node:4.3.1-slim

RUN mkdir -p /opt/app
WORKDIR /opt/app

RUN apt-get update -yq && apt-get install -yq dnsmasq \
    && rm -rf /var/lib/apt/lists && rm -rf /tmp/* && apt-get autoremove -y

COPY package.json /tmp/package.json
COPY npm-shrinkwrap.json /tmp/npm-shrinkwrap.json
RUN cd /tmp && npm install --silent \
    && cp -a /tmp/node_modules /opt/app/ \
    && rm -rf /tmp/*

COPY . /opt/app

RUN npm run gulp build && npm prune --production --silent

EXPOSE 53/udp

CMD ["/bin/sh", "-c", "service dnsmasq start ; npm start"]
