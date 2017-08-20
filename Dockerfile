FROM node:8-alpine

LABEL maintainer "Archomeda (https://github.com/Archomeda/raiders-inn-bot)"

RUN mkdir /bot
WORKDIR /bot
COPY . /bot
RUN yarn install

VOLUME /bot/config
CMD node server.js
