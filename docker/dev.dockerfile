FROM node:4.3.1

# Setup working directory.
RUN mkdir /app
WORKDIR /app

EXPOSE 53

CMD npm install --silent && npm run gulp watch
