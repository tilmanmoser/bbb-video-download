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


## Install

**Dependencies**
Since version 1.2 the script was dockerized, i.e. it needs docker and docker-compose installed on the host. 

```bash
sudo apt update
sudo apt install docker docker-compose
```

**Installation**
```bash
cd /opt
git clone https://github.com/tilmanmoser/bbb-video-download.git
docker-compose build app
```

**If** you want to run the script for every new recording automatically, install the post_publish hook like this:
```bash
cd /opt/bbb-video-download
export BBB_VIDEO_DOWNLOAD_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
envsubst < ./snippets/post_publish_bbb_video_download.rb.template > /usr/local/bigbluebutton/core/scripts/post_publish/a0_post_publish_bbb_video_download.rb
```


## Update
If you're updating from an older version to 1.2, please uninstall and reinstall.

```bash
cd /opt/bbb-video-download
git pull origin master
docker-compose build app
```

## Uninstall
up to version 1.0.x:
```bash
rm /usr/local/bigbluebutton/core/scripts/post_publish/post_publish_bbb_video_download.rb
rm -r /opt/bbb-video-download
```

up to version 1.1.x
```bash
rm /usr/local/bigbluebutton/core/scripts/post_publish/a0_post_publish_bbb_video_download.rb
rm -r /opt/bbb-video-download
```

from version 1.2.x on
```bash
rm /usr/local/bigbluebutton/core/scripts/post_publish/a0_post_publish_bbb_video_download.rb
rm -r /opt/bbb-video-download
sudo docker rmi --force $(docker images -q 'bbb-video-download_app' | uniq)
sudo docker rmi --force $(docker images -q 'node' | uniq)
```


### Create downloadable videos for existing recordings
Use `bbb-record --rebuild <presentation_id>` to reprocess a single presentation or `bbb-record --rebuildall` to reprocess all existing presentations.

Alternatively you can run bbb-video-download manually:
```bash
cd /opt/bbb-video-download
docker-compose run --rm app node index.js -h
>usage: index.js [-h] [-v] -i INPUT -o OUTPUT
>
>A BigBlueButton recording postscript to provide video download capability.
>
>optional arguments:
>  -h, --help            show this help message and exit
>  -v, --version         show program's version number and exit
>  -i INPUT, --input INPUT
>                        path to BigBlueButton published presentation
>  -o OUTPUT, --output OUTPUT
>                        path to outfile
```

Example for a published presentation with internal meeting id 9a9b6536a10b10017f7e849d30a026809852d01f-1597816023148:
```bash
cd /opt/bbb-video-download
docker-compose run --rm app node index.js -i /var/bigbluebutton/published/presentation/9a9b6536a10b10017f7e849d30a026809852d01f-1597816023148 -o /var/bigbluebutton/published/presentation/9a9b6536a10b10017f7e849d30a026809852d01f-1597816023148/video.mp4
```

*Please note, that all directories you want to access as input or output must be mounted as volumes in docker-compose.yml. Out of the box only /var/bigbluebutton/published/presentation is mounted.*


### Info for server administrators
MPEG4 is not a free format. You may need to obtain a license to use this script on your server.

### Version history:
- 1.0.0 initial release
- 1.0.1 - 1.0.6 minor bug fixes
- 1.1.0 major rewrite:
- - script is able to render videos with many(!) whiteboard drawings
- - improved overall quality of images & drawings in presentations
- - cursor rendered as in bbb playback
- - removed chapter marks
- 1.1.1 - 1.1.4 minor bug fixes
- 1.2.0 dockerization of the script due to memory management
