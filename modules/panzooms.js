const { parseStringPromise } = require('xml2js')
const { toArray } = require('./util')


module.exports.parsePanzooms = async (xml) => {
    return parseStringPromise(xml, { explicitArray: false })
        .then(obj => {
            let zooms = []
            if (obj.recording && obj.recording.event) {
                toArray(obj.recording.event).forEach(event => {
                    let start = event.$.timestamp
                    let viewbox = event.viewBox.split(" ")
                        zooms.push(new Zoom(1.0*viewbox[0], 1.0*viewbox[1], 1.0*viewbox[2], 1.*viewbox[3], 1.0*start))
                });
            }
            for (let i=0; i<zooms.length-1; i++)
                zooms[i].end = zooms[i+1].start
            return zooms
        })
        .catch(error => {
            throw error
        })
}

module.exports.extractZoomsBetween = (zooms, start, end) => {
    let zoomsBetween = []
    for (let i = 0; i <zooms.length; i++) {
        if (zooms[i].start >= start && zooms[i].start < end) {
            // start with last zoom viewbox before timewindow
            if (zoomsBetween.length === 0 && i > 0) {
                let zoomBefore = zooms.slice(i-1,i)[0]
                zoomBefore.start = start
                if (!zoomBefore.end) zoomBefore.end = end
                    zoomBefore.end = Math.min(zoomBefore.end, end)
                // only zoom if the viewport has actually changed
                if (Math.abs(zoomBefore.x) > 0)
                    zoomsBetween.push(zoomBefore)
            }
            let zoomCurrent = zooms.slice(i,i+1)[0]
            if (!zoomCurrent.end) zoomCurrent.end = end
                zoomCurrent.end = Math.min(zoomCurrent.end, end)
            // only zoom if the viewport has actually changed
            if (Math.abs(zoomCurrent.x) > 0)
                zoomsBetween.push(zoomCurrent)
        }
    }
    if (zoomsBetween.length > 0) {
        zoomsBetween[zoomsBetween.length-1].end = Math.min(end, zoomsBetween[zoomsBetween.length-1].end)
    }
    return zoomsBetween;
}

class Zoom {
    constructor(x, y, w, h, start, end) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.start = start
        this.end = end
    }

    mapToViewport(canvasWidth, canvasHeight, slideWidth, slideHeight) {
        let actualWidth = slideWidth * ((Math.min(canvasWidth, slideWidth) / Math.max(canvasWidth, slideWidth)))
        let actualHeight= slideHeight * ((Math.min(canvasHeight, slideHeight) / Math.max(canvasHeight, slideHeight)))
        let horizontalPadding = (canvasWidth - actualWidth) / 2
        let verticalPadding = (canvasHeight - actualHeight) / 2
        let zoomWidth = (this.w / slideWidth) * actualWidth
        let zoomHeight = (this.h / slideHeight) * actualHeight
        let zoomX = (this.w / zoomWidth) * this.x + horizontalPadding
        let zoomY = (this.h / zoomHeight) * this.y + verticalPadding
        let isLandscape = (slideWidth >= slideHeight)

        return {
            width: zoomWidth,
            height: zoomHeight,
            x: zoomX,
            y: zoomY,
            isLandscalp: isLandscape
        }
    }

}
module.exports.Zoom = Zoom
