const svgToImg = require('svg-to-img')
const { parseStringPromise } = require('xml2js')
const childProcess = require('child_process')

const parseShapes = async (xml, maxEnd) => {
    return parseStringPromise(xml)
        .then(obj => {
            checkContainsSVG(obj)
            let slides = parseSlides(obj, maxEnd)
            let whiteboards = parseWhiteboards(obj)
            return attachWhiteboardsToSlides(slides, whiteboards)
        })
        .catch(err => {
            throw new Error(err)
        })
}

const createShapes = async (shapes, workdir) => {
    let shapeFiles = {}
    for (let i = 0; i < shapes.length; i++) {
        let shape = shapes[i]
        for (let j = 0; j < shape.whiteboards.length; j++) {
            let whiteboard = shape.whiteboards[j]
            let shapeFile = workdir + '/' + whiteboard.id + '.png'
            await new SVG(shape.width, shape.height).addShape(whiteboard.shape).toPNG(shapeFile)
            shapeFiles[whiteboard.id] = shapeFile
        }
    }
    return shapeFiles
}

const createCanvas = async (dimensions, duration, workDir) => {
    try {
        let canvasImage = workDir + '/canvas.png'
        let canvasVideo = workDir + '/canvas.mp4'
        await new SVG(dimensions.width, dimensions.height)
            .addShape(new Path(`M0 0 L${dimensions.width} 0 L${dimensions.width} ${dimensions.height} L0 ${dimensions.width} Z`, "fill:#F0F0F0"))
            .toPNG(canvasImage)
        childProcess.execSync(`ffmpeg -hide_banner -loglevel panic -loop 1 -framerate 25 -t ${duration} -i ${canvasImage} -c:v libx264 -vf "format=yuv420p" ${canvasVideo}`)
        return canvasVideo
    } catch (error) {
        throw new Error(error)
    }
}


const getDimensionsOfWidestShape = (shapes) => {
    let w=0,h=0
    shapes.forEach(shape => {
        if (shape.width > w) {
            w = shape.width
            h = shape.height
        }
    })
    return {width:w,height:h}
}

const checkContainsSVG = (obj) => {
    if (!obj.svg)
        throw new Error('xml is not a svg file')
}

const parseSlides = (obj, maxEnd) => {
    let slides = {}
    if (obj.svg.image) {
        obj.svg.image.forEach(image => {

            let slide = new Slide(
                image.$.id,
                image.$['xlink:href'],
                1 * image.$.width,
                1 * image.$.height,
                1 * image.$.in,
                Math.min(1 * image.$.out, maxEnd)
            )

            if (!slide.file.includes('logo.png') && !slide.file.includes('deskshare.png'))
                slides[slide.id] = slide
        })
    }
    return slides
}

const parseWhiteboards = (obj) => {
    let whiteboards = {}
    if (obj.svg.g) {
        obj.svg.g.forEach(canvas => {
            if (canvas.g) {
                canvas.g.forEach(element => {
                    let shape = null
                    let style = element.$.style.replace("visibility:hidden;", "")
                    if (element.line) {
                        let line = element.line[0]
                        shape = new Line(1 * line.$.x1, 1 * line.$.y1, 1 * line.$.x2, 1 * line.$.y2, style)
                    } else if (element.circle) {
                        let circle = element.circle[0]
                        shape = new Circle(1 * circle.$.cx, 1 * circle.$.xy, 1 * circle.$.r, style)
                    } else if (element.path) {
                        let path = element.path[0]
                        shape = new Path(path.$.d, style)
                    } else if (element.switch && isVisibleTextElement(element)) {
                        let fo = element.switch[0].foreignObject[0]
                        let p = element.switch[0].foreignObject[0].p[0]
                        shape = new MultilineText(1 * fo.$.x, 1 * fo.$.y, 1 * fo.$.width, 1 * fo.$.height, p._, style)
                    }

                    if (shape) {
                        let whiteboard = new Whiteboard(
                            element.$.shape,
                            canvas.$.image,
                            shape,
                            1 * element.$.timestamp
                        )
    
                        // only store newest shape; i.e. ignore partially drawn shapes
                        if (!whiteboards[whiteboard.id] || whiteboards[whiteboard.id].start < whiteboard.start)
                            whiteboards[whiteboard.id] = whiteboard    
                    }
                })
            }
        })
    }
    return whiteboards
}

const isVisibleTextElement = (element) => {
    return 1 * element.switch[0].foreignObject[0].$.width > 0
}


const attachWhiteboardsToSlides = (slides, whiteboards) => {
    Object.keys(whiteboards).forEach(whiteboardId => {
        let whiteboard = whiteboards[whiteboardId]
        let slide = slides[whiteboard.slideId]
        if (whiteboard.start < slide.start)
            whiteboard.start = slide.start
        slide.whiteboards.push(whiteboard)
    })
    
    let result = []
    Object.keys(slides).forEach(slideId => {
        result.push(slides[slideId])
    })
    return result
}



class Slide {
    constructor(id, file, width, height, start, end) {
        this.id = id
        this.file = file
        this.width = width
        this.height = height
        this.start = start
        this.end = end
        this.whiteboards = []
    }
}

class Whiteboard {
    constructor(id, slideId, shape, start) {
        this.id = id
        this.slideId = slideId
        this.shape = shape
        this.start = start
    }
}

class SVG {
    constructor(w, h) {
        this.w = w
        this.h = h
        this.shapes =[]
    }

    addShape(shape) {
        this.shapes.push(shape)
        return this
    }

    toSVG() {
        let xml = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${this.w}" height="${this.h}" background="rgba(255,255,255,1)">`
        this.shapes.forEach(shape => xml += shape.toSVG())
        xml += '</svg>'
        return xml
    }

    async toPNG(file) {
        return svgToImg
            .from(this.toSVG())
            .toPng({path:file})
    }

}

class Line {
    constructor(x1, y1, x2, y2, style = '') {
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.style = style
    }

    toSVG() {
        return `<line x1="${this.x1}" y1="${this.y1}" x2="${this.x2}" y2="${this.y2}" style="${this.style}" />`
    }
}

class Circle {
    constructor(cx, cy, r, style = '') {
        this.cx = cx
        this.cy = cy
        this.r = r
        this.style = style
    }

    toSVG() {
        return `<circle cx="${this.cx}" cy="${this.cy}" r="${this.r}" style="${this.style}" />`
    }
}

class Path {
    constructor(d, style = '') {
        this.d = d
        this.style = style
    }

    toSVG() {
        return `<path d="${this.d}" style="${this.style}" />`
    }
}

class MultilineText {
    constructor(x, y, w, h, content, style = '') {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.content = content
        this.style = style
    }

    toSVG() {
        return '<switch>' +
            `<foreignObject x="${this.x}" y="${this.y}" width="${this.w}" height="${this.h}">` +
            `<p xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;${this.style}">${this.content}</p>` +
            '</foreignObject>' +
            '</switch>'
    }
}

module.exports = {
    parseShapes: parseShapes,
    createShapes: createShapes,
    getDimensionsOfWidestShape: getDimensionsOfWidestShape,
    createCanvas: createCanvas,
    Slide: Slide,
    Whiteboard: Whiteboard,
    SVG: SVG,
    Line: Line,
    Circle: Circle,
    Path: Path,
    MultilineText: MultilineText
}

