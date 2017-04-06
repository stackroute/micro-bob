FROM node

RUN mkdir -p /srv/app
WORKDIR /srv/app

COPY package.json /srv/app
RUN npm install --production

COPY . .

CMD ["node", "bob-bot-service.js"]
