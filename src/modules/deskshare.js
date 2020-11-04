const fs = require('fs')
const { parseStringPromise } = require('xml2js')
const { parseNumbers } = require('xml2js/lib/processors')

module.exports.parseDeskshares = async (config) => {
    const deskshareXmlFile = config.args.input + '/deskshare.xml'
    const deskshares = {
        parts: []
    }
    
    if (fs.existsSync(deskshareXmlFile)) {
        await parseStringPromise(fs.readFileSync(deskshareXmlFile).toString(), {
            attrValueProcessors: [parseNumbers],
            explicitArray: true
        }).then(data => {
            if (data.recording && data.recording.event) {
                data.recording.event.forEach(evt => {
                    deskshares.parts.push({
                        start: evt.$.start_timestamp,
                        end: evt.$.stop_timestamp,
                        width: evt.$.video_width,
                        height: evt.$.video_height
                    })
                })
            }
        })
    }

    const formats = ['mp4', 'webm']
    for(let i=0; i<formats.length; i++) {
        if (fs.existsSync(config.args.input + '/deskshare/deskshare.' + formats[i])) {
            deskshares.video = config.args.input + '/deskshare/deskshare.' + formats[i]
            continue
        }
    }

    if (deskshares.parts.length > 0 && deskshares.video)
        return deskshares
    return null
}