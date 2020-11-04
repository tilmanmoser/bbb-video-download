const fs = require('fs')
const util = require('util')
const { createPresentationVideo } = require('./presentation')
const { getWebcamsVideo } = require('./webcams')
const childProcess = require('child_process')
const { getVideoInfo } = require('./util')
const { createCaptions } = require('./captions')
const { parseMetadata } = require('./metadata')

module.exports.createVideo = async (config) => {
    // create workdir
    fs.mkdirSync('./tmp', { recursive: true })
    config.workdir = fs.mkdtempSync('./tmp/data')
    
    // metadata
    const metadata = await parseMetadata(config)

    // video & audio
    const webcams = await getWebcamsVideo(config, metadata.duration)
    const presentation = await createPresentationVideo(config, metadata.duration)
    const fullVideo = await combinePresentationWithWebcams(presentation, webcams, config)

    // captions
    const captions = await createCaptions(config)
    if (captions)
        await addCaptions(captions, fullVideo)

    // copy video to destination
    if (!config.args.output.endsWith('.mp4')) {
        const suffix = config.args.output.split('.').pop()
        await renderFinalVideo(fullVideo.video, config.workdir + '/final.' + suffix) 
        moveFile(config.workdir + '/final.' + suffix, config.args.output, config.docker)
    } else {
        moveFile(fullVideo.video, config.args.output, config.docker)
    }
    
    // cleanup workdir
    fs.rmdirSync(config.workdir, { recursive: true })
}

const combinePresentationWithWebcams = async (presentation, webcams, config) => {
    const video = config.workdir + '/video.mp4'

    if (!presentation && !webcams)
        throw new Error('The presentation does not contain any renderable inputs (slides, deskshares or webcams/audio)')
    
    if (presentation && !webcams)
        fs.renameSync(presentation.video, video)
    
    if (!presentation && webcams)
        await copyWebcamsVideo(webcams.video, video)
    
    if (presentation && webcams.isOnlyAudio)
        await copyWebcamsAudioToPresentation(presentation, webcams, video)
    else
        await stackWebcamsToPresentation(presentation, webcams, video)

    return getVideoInfo(video)
}

const copyWebcamsVideo = async (input, output) => {
    childProcess.exec(`ffmpeg -hide_banner -loglevel error -threads 1 -i ${input} -y ${ouput}`)
}

const copyWebcamsAudioToPresentation = async (presentation, webcams, output) => {
    childProcess.execSync(`ffmpeg -hide_banner -loglevel -threads 1 error -i ${presentation.video} -i ${webcams.video} -c:v copy -c:a aac -map 0:0 -map 1:1 -shortest -y ${output}`)
}

const stackWebcamsToPresentation = async (presentation, webcams, output) => {
        const width = presentation.width + webcams.width
        let height = Math.max(presentation.height, webcams.height)
        if (height % 2) height += 1
        childProcess.execSync(`ffmpeg -hide_banner -loglevel error -threads 1 -i ${presentation.video} -i ${webcams.video} -filter_complex "[0:v]pad=width=${width}:height=${height}:color=white[p];[p][1:v]overlay=x=${presentation.width}:y=0[out]" -map [out] -map 1:1 -c:a aac -shortest -y ${output}`)
}

const addCaptions = async (captions, videoObject) => {
    const tmpFile = videoObject.video + '.tmp.mp4'

    let cmd = 'ffmpeg -hide_banner -loglevel error -threads 1 -i ' + videoObject.video
    captions.forEach(caption => { cmd += ' -i ' + caption.file})
    cmd += ' -map 0'
    captions.forEach((caption,idx) => { cmd += ` -map ${idx+1}:s`})
    cmd += ' -c copy'
    captions.forEach(caption => cmd += ' -c:s mov_text')
    captions.forEach((caption, idx) => { cmd += ` -metadata:s:s:${idx} language=${caption.code}`})
    cmd += ' -y ' + tmpFile    
    
    childProcess.execSync(cmd)

    if (fs.existsSync(videoObject.video))
        fs.unlinkSync(videoObject.video)
    fs.renameSync(tmpFile, videoObject.video)
}

const renderFinalVideo = async (input, output) => {
    childProcess.execSync(`ffmpeg -hide_banner -loglevel error -threads 1 -i ${input} -y ${output}`)
}

const moveFile = (src,dst,isRunningInDocker) => {
    if (isRunningInDocker)
        childProcess.execSync(`mv ${src} ${dst}`)
    else
        fs.renameSync(src,dst)
}