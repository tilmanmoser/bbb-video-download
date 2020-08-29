# bbb-video-download
A BigBlueButton recording postscript to provide video download

## Install
This instruction assumes you run BigBlueButton v2.2 on Ubuntu 16.04 as described in the official [documentation](https://docs.bigbluebutton.org/2.2/install.html).

### Dependencies
Install Node.
```bash
cd /opt
sudo curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
sudo chmod u+x ./nodesource_setup.sh
sudo ./nodesource_setup.sh
sudo apt-get install -y nodejs
```

Verify node was installed properly.
```bash
node -v
> v14.9.0
```

Install Yarn.
```bash
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install yarn
```

Verify yarn was installed properly.
```bash
yarn -v
> 1.22.5
```

Install dependencies for image processing
```bash
sudo apt update
sudo apt install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

### Install bbb-video-download
```
cd /opt
git clone https://github.com/tilmanmoser/bbb-video-download.git
cd bbb-video-download
yarn install
```

Verify installation
```bash
yarn test
```





