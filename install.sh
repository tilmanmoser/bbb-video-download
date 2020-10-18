#!/bin/bash

# install dependencies for video processing
apt update
apt install -yq chromium-browser gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# download node12 binaries
wget https://nodejs.org/dist/v12.18.3/node-v12.18.3-linux-x64.tar.xz
tar -xf node-v12.18.3-linux-x64.tar.xz
mv node-v12.18.3-linux-x64 node12
rm node-v12.18.3-linux-x64.tar.xz

# install node_modules
./node12/bin/npm install

# install post_publish script
export BBB_VIDEO_DOWNLOAD_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
envsubst < ./snippets/post_publish_bbb_video_download.rb.template > /usr/local/bigbluebutton/core/scripts/post_publish/a0_post_publish_bbb_video_download.rb

# change ownership
chown bigbluebutton:bigbluebutton /usr/local/bigbluebutton/core/scripts/post_publish/a0_post_publish_bbb_video_download.rb
chown -R bigbluebutton:bigbluebutton ${BBB_VIDEO_DOWNLOAD_DIR} 