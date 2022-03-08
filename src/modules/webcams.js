const { getVideoInfo } = require('./util')
const fs = require('fs')
const childProcess = require('child_process')

module.exports.getWebcamsVideo = async (config, duration) => {    
    
    let videoFile = null    
    const formats = ['mp4', 'webm']
    for(let i=0; i<formats.length; i++) {
        if (fs.existsSync(config.args.input + '/video/webcams.' + formats[i])) {
            videoFile = config.args.input + '/video/webcams.' + formats[i]
            continue
        }
    }

    if (videoFile) {
        const videoInfo = await getVideoInfo(videoFile)
        if(config.args.isOnlyAudio !== null) {
            videoInfo.isOnlyAudio = config.args.isOnlyAudio
        } else {
            videoInfo.isOnlyAudio = await isAllWhiteVideo(videoFile, duration)
        }
        return videoInfo
    }

    return null
}

const isAllWhiteVideo = async (video, duration) => {
    try {
        let whiteframes = childProcess.execSync(`ffmpeg -i ${video} -vf "negate,blackdetect=d=2:pix_th=0.00" -an -f null - 2>&1 | grep blackdetect`).toString()
        let whiteduration = 1.0 * whiteframes.split("\n")[0].match(/black_duration:([^\s]*)/)[1]
        if (Math.abs(duration - whiteduration) < 1.0)
            return true
    } catch (error) {
        // ignore since childprocess fails when there are no white sequences
    }
    return false
}