FROM node:12-alpine3.11
RUN apk add --no-cache chromium ffmpeg
RUN adduser -D bigbluebutton bigbluebutton
USER bigbluebutton
WORKDIR /home/bigbluebutton
COPY package.json ./
RUN yarn install
COPY . .