const langs = require('langs')
const fs = require('fs')
const childProcess = require('child_process')

module.exports.parseCaptions = async (json) => {
    try {
        let captions = []
        let array = JSON.parse(json)
        array.forEach(element => {
            captions.push({
                language: element.localeName,
                code1: element.locale,
                code2: langs.where(1, element.locale)['2']
            })
        })
        return captions
    } catch (err) {
        throw new Error(err)
    }
}

module.exports.createCaptions = async (captions, inputDir, workDir) => {
    let captionFiles = []
    if (Array.isArray(captions))
        captions.forEach(caption => {
            let captionVTT = inputDir + '/caption_' + caption.code1 + '.vtt'
            let captionSRT = workDir + '/caption_' + caption.code2 + '.srt'
            if (fs.existsSync(captionVTT)) {
                try {
                    childProcess.execSync(`ffmpeg -i ${captionVTT} ${captionSRT}`)
                    captionFiles.push({ file: captionSRT, lang: caption.code2 })
                } catch (error) {
                    throw new Error(error.message)
                }
            }
        })
    return captionFiles
}