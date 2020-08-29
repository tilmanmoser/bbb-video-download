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





