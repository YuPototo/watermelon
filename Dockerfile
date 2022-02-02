# Our first stage, that is the Builder
FROM node:16 AS app-builder

WORKDIR /app

# 安装 dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn install

# COPY source code
COPY . ./


# generate db schema
RUN yarn prisma generate

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
COPY prisma .

COPY --from=app-builder ./app/out ./out
RUN yarn install --production

# generate db schema
RUN yarn prisma generate

CMD ["yarn", "start"]
