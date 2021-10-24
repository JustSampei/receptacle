FROM node:alpine as builder

COPY . .

RUN npm i && npm i -D
RUN npm run build

#Step 2
FROM node:alpine as runner

WORKDIR /app

COPY --from=builder server.js .
COPY --from=builder public/ public/

RUN npm i express

CMD ["node", "server.js"]