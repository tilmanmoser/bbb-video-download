# bbb-video-download
A BigBlueButton recording postscript to provide video download
Tested with BigBlueButton v2.2.23

## Install
This instruction assumes you run BigBlueButton v2.2 on Ubuntu 16.04 as described in the official [documentation](https://docs.bigbluebutton.org/2.2/install.html).

Install dependencies for image processing
```bash
sudo apt update
sudo apt install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

Provide node 12 binaries.
```bash
cd /opt
wget https://nodejs.org/dist/v12.18.3/node-v12.18.3-linux-x64.tar.xz
tar -xf node-v12.18.3-linux-x64.tar.xz
mv node-v12.18.3-linux-x64 node12
rm node-v12.18.3-linux-x64.tar.xz
```

Explanation: BBB relies on node version 8. It will break, when you install node v12 globally. For the script we'll use the binaries in /opt/node12. Please note, that tests will not run this way. If you'd like to run the tests, checkout the project to your local machine and run "npm test".

### Install bbb-video-download
```
cd /opt
git clone https://github.com/tilmanmoser/bbb-video-download.git
cd bbb-video-download
/opt/node12/bin/npm install
```

### Usage
```bash
cd /opt/bbb-video-download
/opt/node12/bin/node index.js -h
>usage: index.js [-h] [-v] -i INPUT -o OUTPUT
>
>optional arguments:
>  -h, --help            show this help message and exit
>  -v, --version         show program's version number and exit
>  -i INPUT, --input INPUT
>                        Path to published presentation
>  -o OUTPUT, --output OUTPUT
>                        Outputfile .mp4|.webm
```

Example for a published presentation with internal meeting id 9a9b6536a10b10017f7e849d30a026809852d01f-1597816023148:
```bash
cd /opt/bbb-video-download
/opt/node12/bin/node index.js -i /var/bigbluebutton/published/presentation/9a9b6536a10b10017f7e849d30a026809852d01f-1597816023148 -o test.mp4
```

### Install bbb-video-downloader as a BBB post_publish script
```bash
cd /usr/local/bigbluebutton/core/scripts/post_publish
sudo cp post_publish.rb.example post_publish_bbb_video_download.rb
sudo vim post_publish_bbb_video_download.rb
```

Replace the line `# Put your code here` with 
```ruby
logger.info("Creating downloadable video for meeting id #{meeting_id}")
rs = system("cd /opt/bbb-video-download && /opt/node12/bin/node index.js -i #{published_files} -o #{published_files}/#{meeting_id}.mp4")
logger.info(rs)
````

The script will now run after BBB published a recording. Once the script finished your video will be available under https://<your-bbb-server>/presentation/<presentationid>/<presentationid>.mp4







