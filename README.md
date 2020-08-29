# bbb-video-download
A BigBlueButton recording postscript to provide video download
Tested with BigBlueButton v2.2.23

## Install
This instruction assumes you run BigBlueButton v2.2 on Ubuntu 16.04 as described in the official [documentation](https://docs.bigbluebutton.org/2.2/install.html).

BBB relies on node v8.x, whilst this script requires node v12.x. In order to satisfy this depdency, whithout breaking BBB, we'll use nvm.

```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.35.3/install.sh | bash
source /root/bash.rc
nvm --version
> 0.35.3
```

Install Node 8 first (this will be the default for BBB)
```bash
nvm install 8
```

Install Node 14 second (this will be used by our script)
```bash
nvm install 14
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
npm install
```

Verify installation
```bash
npm test
```
If the test 'SVG.toPNG() should create a png image' fails, you forgot to install the dependencies for image processing (see above).

### Usage
```bash
cd /opt/bbb-video-download
yarn process -h
>yarn run v1.22.5
>$ node index.js -h
>usage: index.js [-h] [-v] -i INPUT -o OUTPUT
>
>optional arguments:
>  -h, --help            show this help message and exit
>  -v, --version         show program's version number and exit
>  -i INPUT, --input INPUT
>                        Path to published presentation
>  -o OUTPUT, --output OUTPUT
>                        Outputfile .mp4|.webm
>Done in 0.30s.
```

Example for a published presentation with internal meeting id 9a9b6536a10b10017f7e849d30a026809852d01f-1597816023148:
```bash
cd /opt/bbb-video-download
yarn process -i /var/bigbluebutton/published/presentation/9a9b6536a10b10017f7e849d30a026809852d01f-1597816023148 -o test.mp4
```

### Install bbb-video-downloader as a BBB post_publish script
```bash
cd /usr/local/bigbluebutton/core/scripts/post_publish
sudo cp post_publish.rb.example post_publish_bbb_video_download.rb
sudo vim post_publish_bbb_video_download.rb
```

Replace the line `# Put your code here` with 
```ruby
system ("cd /opt/bbb-video-download && yarn process -i #{published_files} -o #{published_files}/#{meeting_id}.mp4")
````

The script will now run after BBB published a recording. Once the script finished your video will be available under https://<your-bbb-server>/presentation/<presentationid>/<presentationid>.mp4







