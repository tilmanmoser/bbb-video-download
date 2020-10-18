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

    return await combinedSlidesAndDeskshares(slides, deskshares, config)

}
const onlySlides = async (slides) => {
    return await getVideoInfo(slides.video)
}

const onlyDeskshares = async (deskshares) => {
    return await getVideoInfo(deskshares.video)
}

const combinedSlidesAndDeskshares = async (slides, deskshares, config) => {
    const tmpFile = config.workdir + '/presentation.tmp.mp4'
    const outFile = config.workdir + '/presentation.mp4'

    for (let chunk=0; chunk<deskshares.parts.length; chunk+=config.env.chunksize) {
        const parts = deskshares.parts.slice(chunk, chunk+config.env.chunksize)
        const filters = ['[1:v][0:v]scale2ref[d][v1]']

        parts.forEach(part => {
            filters.push(`[v${filters.length}][d]overlay=enable='between(t,${part.start},${part.end})'[v${filters.length+1}]`)
        })

        const cmd = `ffmpeg -hide_banner -loglevel error -i ${slides.video} -i ${deskshares.video} -filter_complex "${filters.join(';')}" -map '[v${filters.length}]' -threads 1 ${tmpFile}`
        childProcess.execSync(cmd)
        if (fs.existsSync(outFile))
                fs.unlinkSync(outFile)
            fs.renameSync(tmpFile, outFile)
    } 

    return await getVideoInfo(outFile)
}
