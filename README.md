# bbb-video-download
A BigBlueButton recording postscript to provide video download capability.

Tested with BigBlueButton v2.2.23.

## Install
This instruction assumes you run BigBlueButton v2.2 on Ubuntu 16.04 as described in the official [documentation](https://docs.bigbluebutton.org/2.2/install.html).

```bash
cd /opt
git clone https://github.com/tilmanmoser/bbb-video-download.git
cd bbb-video-download
chmod u+x install.sh
sudo ./install.sh
```

The installation script will
* install dependencies for images processing via apt
* download node v12 binaries for linux x64 (as BBB only provides node v12).
* install node_modules for bbb_video_download
* copy a post_publish script, so that downloadable videos are created automatically

The downloadable video will be stored after processing at /var/bigbluebutton/published/presentation/<presentation_id>/video.mp4 and can be accessed in the browser at https://<your_bbb_server>/presentation/<presentationid>/video.mp4

### Manually (re)create presentation videos
```bash
cd /opt/bbb-video-download
./node12/bin/node index.js -h
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
./node12/bin/node index.js -i /var/bigbluebutton/published/presentation/9a9b6536a10b10017f7e849d30a026809852d01f-1597816023148 -o your-video.mp4
```






