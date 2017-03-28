FROM node

RUN mkdir -p /srv/app
WORKDIR /srv/app

COPY package.json /srv/app
RUN npm install --production

RUN npm install webpack -g

COPY . .

RUN webpack

CMD ["npm", "start"]
