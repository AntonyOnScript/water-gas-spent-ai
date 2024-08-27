FROM node:18

WORKDIR /app

RUN yarn global add typescript

COPY package.json /app 

COPY . . 

EXPOSE 3000