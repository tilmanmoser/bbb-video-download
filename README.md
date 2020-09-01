# bbb-video-download
A BigBlueButton recording postscript to provide video download capability.

The assembled video includes:
* shared audio and webcams video
* presented slides with
    * whiteboard actions (text and drawings)
    * cursor movements
    * zooming
* screen sharing
* captions
* chapter marks for each slide & screensharing

Differences to bbb presentation:
* The cursor is rendered as a square box instead of a circle
* The cursor will grow in size when zoom is applied

## Install
**IMPORTANT:** The provided install-script assumes you run BigBlueButton v2.2 on Ubuntu 16.04 as described in the official [documentation](https://docs.bigbluebutton.org/2.2/install.html); i.e. bbb specific folders like the installation directory (/usr/local/bigbluebutton), data directory (/var/bigbluebutton) and log directory (/var/log/bigbluebutton) are hard coded into the scripts.

Tested with BigBlueButton v2.2.23.

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
* change the ownership of the installation directory and post script to bigbluebutton

**IMPORTANT:** Don't update node via apt, since BBB relies on node v8!

The downloadable video will be stored after processing at `/var/bigbluebutton/published/presentation/<presentation_id>/video.mp4` and can be accessed in the browser at `https://<your_bbb_server>/presentation/<presentationid>/video.mp4`.

### Create downloadable videos for existing recordings
Use `bbb-record --rebuild <presentation_id>` to reprocess a single presentation or `bbb-record --rebuildall` to reprocess all existing presentations.

Alternatively you can run bbb-video-download manually:
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
>                        Outputfile .mp4
```

Example for a published presentation with internal meeting id 9a9b6536a10b10017f7e849d30a026809852d01f-1597816023148:
```bash
cd /opt/bbb-video-download
./node12/bin/node index.js -i /var/bigbluebutton/published/presentation/9a9b6536a10b10017f7e849d30a026809852d01f-1597816023148 -o your-video.mp4
```

### Troubleshooting
Check /var/log/bigbluebutton/post_publish.log for errors.

### Info for server administrators
MPEG4 is not a free format. You may need to obtain a license to use this script on your server.

### Info for fellow developers
Feel free to reuse my code for further enhancements. The assembled ffmpeg command that renders the video is logged in /var/log/bigbluebutton/post_publish.log.
