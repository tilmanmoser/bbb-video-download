const childProcess = require('child_process')

module.exports.getVideoInfo = async (video) => {
    const videoInfo = JSON.parse(
        childProcess.execSync('ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json ' + video)
    )
    return {
        video: video,
        duration: videoInfo.streams[0].duration * 1.0,
        width: videoInfo.streams[0].width * 1,
        height: videoInfo.streams[0].height * 1
    }
}

