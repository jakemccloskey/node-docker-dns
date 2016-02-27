FROM node:4.3.1

# Setup working directory.
RUN mkdir /app
WORKDIR /app

EXPOSE 53

COPY . .
RUN npm install --silent \
    && npm run gulp build \
    && npm prune --production

CMD npm start
