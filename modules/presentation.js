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
    const width = slides.viewport.width
    const height = slides.viewport.height
    let ts = 0
    let videoFiles = ''
    deskshares.parts.forEach((part, index) => {
        // trim slides part
        if (ts < part.start) {
            const slidesPartVideo = 'slides_' + index + '.mp4'
            childProcess.execSync(`ffmpeg -hide_banner -loglevel error -threads 1 -i ${slides.video} -vcodec copy -acodec copy -ss ${ts} -to ${part.start} ${config.workdir}/${slidesPartVideo}`)
            videoFiles += "file '" + slidesPartVideo + "'\n"
        }
        // trim, scale and pad deskshare part
        const desksharePartVideo = 'deskshare_' + index + '.mp4'
        childProcess.execSync(`ffmpeg -hide_banner -loglevel error -threads 1 -i ${deskshares.video} -ss ${part.start} -to ${part.end} -vf "scale=w=${width}:h=${height}:force_original_aspect_ratio=1,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=white" -c:v libx264 -preset ultrafast ${config.workdir}/${desksharePartVideo}`)
        videoFiles += "file '" + desksharePartVideo + "'\n"
        ts = part.end
    })
    // trim last slides part
    if (ts < duration) {
        const slidesPartVideo = 'slides_end.mp4'
        childProcess.execSync(`ffmpeg -hide_banner -loglevel error -threads 1-i ${slides.video} -vcodec copy -acodec copy -ss ${ts} -to ${duration} ${config.workdir}/${slidesPartVideo}`)
        videoFiles += "file '" + slidesPartVideo + "'\n"
    }

    // write parts to file
    const partsTxt = config.workdir + '/presentation_parts.txt'
    fs.writeFileSync(partsTxt, videoFiles)

    // render combined presentation video
    const outFile = config.workdir + '/presentation.mp4'
    childProcess.execSync(`ffmpeg -hide_banner -loglevel error -threads 1 -f concat -i ${partsTxt} -crf 22 -pix_fmt yuv420p ${outFile}`)
    return await getVideoInfo(outFile)
}
