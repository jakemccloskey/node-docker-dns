FROM node:4.3.1-slim

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY package.json /tmp/package.json
COPY npm-shrinkwrap.json /tmp/npm-shrinkwrap.json
RUN cd /tmp && npm install --silent \
    && cp -a /tmp/node_modules /opt/app/ \
    && rm -rf /tmp/*

COPY . /opt/app

RUN npm run gulp build && npm prune --production --silent

EXPOSE 53/udp

CMD ["npm", "start"]
