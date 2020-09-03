const { parseStringPromise } = require('xml2js')
const { toArray } = require('./util')


module.exports.parseCursors = async (xml) => {
    return parseStringPromise(xml, { explicitArray: false })
        .then(obj => {
            let cursors = []
            if (obj.recording && obj.recording.event) {
                toArray(obj.recording.event).forEach(event => {
                    let start = event.$.timestamp
                    let coords = event.cursor.split(" ")
                    cursors.push(new Cursor(1.0*coords[0], 1.0*coords[1], 1.0*start))
                });
            }
            for (let i=0; i<cursors.length-1; i++)
                cursors[i].end = cursors[i+1].start
            return cursors
        })
        .catch(error => {
            throw error
        })
}

module.exports.extractCursorsBetween = (cursors, start, end) => {
    let cursorsBetween = []
    for (let i = 0; i <cursors.length; i++) {
        if (cursors[i].start >= start && cursors[i].start < end) {
            // start with last cursor position before timewindow
            if (cursorsBetween.length === 0 && i > 0) {
                let cursorBefore = cursors.slice(i-1,i)[0]
                cursorBefore.start = start
                if (cursorBefore.end > end) 
                    cursorBefore.end = end
                cursorsBetween.push(cursorBefore)
            }
            let cursorCurrent = cursors.slice(i,i+1)[0]
            if (!cursorCurrent.end || cursorCurrent.end > end) 
                cursorCurrent.end = end
            cursorsBetween.push(cursorCurrent)
        }
    }
    return cursorsBetween;
}

class Cursor {
    constructor(x, y, start) {
        this.x = x
        this.y = y
        this.start = start
    }

   mapToViewport(canvasWidth, canvasHeight, slideWidth, slideHeight) {
        let actualWidth = slideWidth * (Math.min(canvasWidth, slideWidth) / Math.max(canvasWidth, slideWidth))
        let actualHeight = slideHeight * (Math.min(canvasHeight, slideHeight) / Math.max(canvasHeight, slideHeight))
        let horizontalPadding = (canvasWidth - actualWidth) / 2
        let verticalPadding = (canvasHeight - actualHeight) / 2
        let x = this.x * actualWidth + horizontalPadding
        let y = this.y * actualHeight + verticalPadding
        return {
            x: x,
            y: y
        }
    }
}
module.exports.Cursor = Cursor
