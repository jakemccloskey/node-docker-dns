FROM node:4.3.1-slim

RUN mkdir -p /opt/app
WORKDIR /opt/app

EXPOSE 53/udp

CMD ["npm", "install", "--silent", "&&", "npm", "start"]
