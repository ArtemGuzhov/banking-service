FROM node:14-alpine3.14

WORKDIR /usr/src/app

COPY package*.json ./

COPY . .

RUN npm i

CMD ["npm", "run", "start:dev"]