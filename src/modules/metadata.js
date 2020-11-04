const fs = require('fs')
const { parseStringPromise } = require('xml2js')
const { parseNumbers } = require('xml2js/lib/processors')

module.exports.parseMetadata = async (config) => {
    if (fs.existsSync(config.args.input + '/metadata.xml')) {
        return parseStringPromise(fs.readFileSync(config.args.input + '/metadata.xml').toString(), {
            attrValueProcessors: [parseNumbers],
            explicitArray: false
        }).then(data => {
            return {
                duration: data.recording.playback.duration / 1000
            }
        })
    } else {
        throw new Error('metadata.xml not found in input directory')
    }
}