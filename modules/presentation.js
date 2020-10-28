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
    const filtersScriptFile = config.workdir + '/filters.txt'
    const tmpFile = config.workdir + '/presentation.tmp.mp4'
    const outFile = config.workdir + '/presentation.mp4'

    const scaling = (deskshares.width > deskshares.height)
        ? '-2:' + slides.viewport.height
        : slides.viewport.width + ':-2'

    let dparts = ''
    deskshares.parts.forEach((part,index) => {dparts += '[d' + index + ']'});

    const filters = [`[1]scale=${scaling},split${dparts}`]
    deskshares.parts.forEach((part,index) => {
        const inStream = (index > 0) ? '[v' + filters.length + ']' : '[0]'
        filters.push(`${inStream}[d${index}]overlay=enable='between(t,${part.start},${part.end})'[v${filters.length+1}]`)
    })
    fs.writeFileSync(filtersScriptFile, filters.join(";\n"))

    const cmd = `ffmpeg -hide_banner -loglevel error -i ${slides.video} -i ${deskshares.video} -filter_complex_script ${filtersScriptFile} -map '[v${filters.length}]' -threads 1 ${tmpFile}`
    childProcess.execSync(cmd)
    if (fs.existsSync(outFile))
        fs.unlinkSync(outFile)
    fs.renameSync(tmpFile, outFile)

    return await getVideoInfo(outFile)
}
