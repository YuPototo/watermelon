# Our first stage, that is the Builder
FROM node:16 AS app-builder

WORKDIR /app

# 安装 dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn install

# COPY source code
COPY . ./

# build
RUN yarn build

# Our Second stage, that creates an image for production
FROM node:16 AS app-prod

RUN mkdir p ~/logs

WORKDIR /app

COPY config ./config
COPY tsconfig.json .
COPY package.json .
COPY yarn.lock .

COPY --from=app-builder ./app/out ./out
RUN yarn install --production

CMD ["yarn", "start"]
