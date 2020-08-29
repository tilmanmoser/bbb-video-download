const { parseStringPromise } = require('xml2js')

module.exports.parseMetadata = async (xml) => {
    return parseStringPromise(xml, { explicitArray: false })
        .then(obj => {
            let metadata = {}
            if (obj.recording) {
                metadata.id = obj.recording.id
                metadata.start = new Date(1*obj.recording.start_time)
                metadata.end = new Date(1*obj.recording.end_time)
                metadata.duration = 1* obj.recording.playback.duration / 1000
                metadata.name = obj.recording.meeting.$.name
            }
            return metadata
        })
        .catch(err => {
            throw new Error(err)
        })
}
