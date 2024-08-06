FROM node:lts-buster-slim

RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

COPY package.json /app/package.json
COPY src /app/src

RUN npm i

CMD ["npm", "start"]
