const { renderSlides } = require("./slides")
const { parseDeskshares } = require("./deskshare")
const childProcess = require('child_process')
const fs = require("fs")
const util = require('util')
const { getVideoInfo } = require('./util')

module.exports.createPresentationVideo = async (config, metadata) => {

    const slides = await renderSlides(config, metadata)
    const deskshares = await parseDeskshares(config)

    if (!slides && !deskshares)
        return null

    if (slides && !deskshares)
        return await onlySlides(slides)

    if (!slides && deskshares)
        return await onlyDeskshares(deskshares)

    return await combinedSlidesAndDeskshares(slides, deskshares, config, metadata.duration)

}
const onlySlides = async (slides) => {
    return await getVideoInfo(slides.video)
}

const onlyDeskshares = async (deskshares) => {
    return await getVideoInfo(deskshares.video)
}

const combinedSlidesAndDeskshares = async (slides, deskshares, config, duration) => {
    const width = config.args.width
    const height = config.args.height
    const resizedDesksharesVideo = config.workdir + '/deskshare.mp4'
    const presentationTmp = config.workdir + '/presentation.tmp.mp4'
    const presentationOut = config.workdir + '/presentation.mp4'

    childProcess.execSync(`ffmpeg -hide_banner -loglevel error -threads ${config.args.threads} -i ${deskshares.video} -vf "scale=w=${width}:h=${height}:force_original_aspect_ratio=1,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=white" -c:v libx264 -preset ultrafast ${resizedDesksharesVideo}`)
    deskshares.parts.forEach((part, index) => {
        const presentationIn = (index == 0) ? slides.video : presentationOut
        childProcess.execSync(`ffmpeg -hide_banner -loglevel error -threads ${config.args.threads} -i ${presentationIn} -i ${resizedDesksharesVideo} -filter_complex "[0][1]overlay=x=0:y=0:enable='between(t,${part.start},${part.end})'[out]" -map [out] -c:a copy -c:v libx264 -preset ultrafast ${presentationTmp}`)
        if (fs.existsSync(presentationOut))
            fs.unlinkSync(presentationOut)
        fs.renameSync(presentationTmp, presentationOut)
    })

    return await getVideoInfo(presentationOut)
}
