const fs = require('fs')
const langs = require('langs')
const childProcess = require('child_process')

module.exports.createCaptions = async (config) => {
    if (fs.existsSync(config.args.input + '/captions.json')) {
        const captions = JSON.parse(fs.readFileSync(config.args.input + '/captions.json').toString())
        if (Array.isArray(captions) && captions.length > 0) {
            for (let i=0; i<captions.length; i++) {
                await transformCaptions(captions[i], config)
            }
            return captions
        }
    }
    return null
}

const transformCaptions = async (caption, config) => {
    const captionCode = langs.where(1, caption.locale)['2']
    const captionInFile = config.args.input + '/caption_' + caption.locale + '.vtt'
    const captionOutFile = config.workdir + '/caption_' + captionCode + '.srt'

    childProcess.execSync(`ffmpeg -hide_banner -loglevel warning -i ${captionInFile} ${captionOutFile}`)

    caption.code = captionCode
    caption.file = captionOutFile
}