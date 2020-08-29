const { parseStringPromise } = require('xml2js')
const { toArray } = require('./util')


module.exports.parseDeskshares = async (xml) => {
    return parseStringPromise(xml, { explicitArray: false })
        .then(obj => {
            let deskshares = []
            if (obj.recording && obj.recording.event) {
                toArray(obj.recording.event).forEach(event => {
                    let start = 1.0 * event.$.start_timestamp
                    let end = 1.0 * event.$.stop_timestamp
                    deskshares.push({
                        start: start,
                        end: end
                    })
                });
            }
            return deskshares
        })
        .catch(err => {
            throw new Error(err)
        })
}

