FROM node:18

WORKDIR /app
# ENV below is needed for the first build
ENV DATABASE_URL=mysql://root:root@water-gas-db:3306/water-gas 
RUN yarn global add typescript

COPY package.json /app  
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY . . 

RUN npx prisma generate 

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

EXPOSE 3000
