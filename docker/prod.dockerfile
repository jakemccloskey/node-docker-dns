FROM node:4.3.1

# Setup working directory.
RUN mkdir /app
WORKDIR /app

EXPOSE 53

COPY . .
RUN npm install --silent

CMD npm start
