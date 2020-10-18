const fs = require('fs')
const http = require('http')
const getPort = require('get-port')
const puppeteer = require('puppeteer-core')
const childProcess = require('child_process')
const { parseStringPromise } = require('xml2js')
const { parseNumbers } = require('xml2js/lib/processors')

module.exports.renderSlides = async (config, duration) => {
    const presentation = await parseSlidesData(config.args.input, duration)
    if (Object.keys(presentation.frames).length > 1) {
        await createFrames(config, presentation)
        await renderVideo(config, presentation)
        return presentation
    }
    return null
}

const actions = {
    showImage: 'showImage',
    hideImage: 'hideImage',
    showDrawing: 'showDrawing',
    setViewBox: 'setViewBox',
    moveCursor: 'moveCursor'
}

const parseSlidesData = async (basedir, duration) => {
    const presentation = {
        frames: {}
    }

    if (fs.existsSync(basedir + '/shapes.svg')) {
        await parseStringPromise(fs.readFileSync(basedir + '/shapes.svg').toString(), {
            attrValueProcessors: [parseNumbers],
            explicitArray: true
        }).then(data => {
            parseInitialViewbox(data, presentation)
            parseImages(data, presentation.frames, duration)
            parseDrawings(data, presentation.frames, duration)
        })
    }

    if (fs.existsSync(basedir + '/panzooms.xml')) {
        await parseStringPromise(fs.readFileSync(basedir + '/panzooms.xml').toString(), {
            attrValueProcessors: [parseNumbers],
            explicitArray: true
        }).then(data => {
            parseZooms(data, presentation.frames, duration)
        })
    }

    if (fs.existsSync(basedir + '/cursor.xml')) {
        await parseStringPromise(fs.readFileSync(basedir + '/cursor.xml').toString(), {
            attrValueProcessors: [parseNumbers],
            explicitArray: true
        }).then(data => {
            parseCursors(data, presentation.frames, duration)
        })
    }

    return presentation
}

const parseInitialViewbox = (data, presentation) => {
    if (data.svg) {
        const viewbox = data.svg.$.viewBox.split(" ")
        presentation.viewport = {
            width: viewbox[2] * 1.0,
            height: viewbox[3] * 1.0,
        }
    }
}


const parseImages = (data, frames, duration) => {
    if (data.svg) {
        if (data.svg.image) {
            data.svg.image.forEach(image => {
                if (image.$.in < duration) {
                    getFrameByTimestamp(frames, image.$.in).actions.push({
                        action: actions.showImage,
                        id: image.$.id,
                        width: image.$.width,
                        height: image.$.height
                    })
                    getFrameByTimestamp(frames, Math.min(duration, image.$.out)).actions.push({
                        action: actions.hideImage,
                        id: image.$.id
                    })
                }
            })
        }
    }
}

const parseDrawings = (data, frames, duration) => {
    const shapes = {}
    if (data.svg.g) {
        data.svg.g.forEach(canvas => {
            if (canvas.g) {
                canvas.g.forEach(element => {
                    if (element.$.timestamp < duration)
                        if (!shapes[element.$.shape] || shapes[element.$.shape].timestamp < element.$.timestamp)
                            shapes[element.$.shape] = {
                                id: element.$.id,
                                timestamp: element.$.timestamp
                            }
                })
            }
        })
    }
    Object.keys(shapes).forEach(shapeId => {
        getFrameByTimestamp(frames, shapes[shapeId].timestamp).actions.push({
            action: actions.showDrawing,
            id: shapes[shapeId].id
        })
    })
}

const parseZooms = (data, frames, duration) => {
    if (data.recording && data.recording.event) {
        data.recording.event.forEach(evt => {
            if (evt.$.timestamp < duration)
                getFrameByTimestamp(frames, evt.$.timestamp).actions.push({
                    action: actions.setViewBox,
                    value: evt.viewBox[0]
                })
        })
    }
}

const parseCursors = (data, frames, duration) => {
    if (data.recording && data.recording.event) {
        data.recording.event.forEach(evt => {
            if (evt.$.timestamp < duration)
                getFrameByTimestamp(frames, evt.$.timestamp).actions.push({
                    action: actions.moveCursor,
                    value: evt.cursor[0].split(' ')
                })
        })
    }
}

const getFrameByTimestamp = (frames, timestamp) => {
    if (!frames[timestamp])
        frames[timestamp] = {
            timestamp: timestamp,
            actions: []
        }
    return frames[timestamp]
}


const createFrames = async (config, presentation) => {
    const port = await getPort({ port: getPort.makeRange(3000, 3100) })
    const server = await createServer(config.args.input, port)
    await captureFrames('http://localhost:' + port, presentation, config.workdir)
    server.close()
}

const createServer = async (basedir, port) => {
    return http.createServer((req, res) => {
        fs.readFile(basedir + req.url, (err, data) => {
            if (err) {
                res.writeHead(404)
                res.end(JSON.stringify(err))
                return
            }
            res.writeHead(200)
            res.end(data)
        })
    }).listen(port)
}

const captureFrames = async (serverUrl, presentation, workdir) => {
    const browser = await puppeteer.launch({
         /*headless: false, */
         executablePath: '/usr/bin/chromium-browser'
        })
    const page = await browser.newPage()
    await page.setViewport({
        width: presentation.viewport.width,
        height: presentation.viewport.height,
        deviceScaleFactor: 1
    })
    await page.goto(serverUrl + '/shapes.svg')
    await page.waitForSelector('#svgfile')
    // add cursor
    await page.evaluate(() => { 
        let el = document.querySelector('#svgfile')
        el.innerHTML = el.innerHTML + '<circle id="cursor" cx="9999" cy="9999" r="5" stroke="red" stroke-width="3" fill="red" style="visibility:hidden" />'
    })
    let currentImage = {
        width: 0,
        height: 0
    }
    const timestamps = Object.keys(presentation.frames).sort((a, b) => { return 1.0 * a - 1.0 * b })
    for (let i = 0; i < timestamps.length; i++) {
        const frame = presentation.frames[timestamps[i]]
        for (let j = 0; j < frame.actions.length; j++) {
            const action = frame.actions[j]
            switch (action.action) {
                case actions.showImage:
                    await showImage(page, action.id)
                    currentImage.width = action.width
                    currentImage.height = action.height
                    showCursor(page)
                    break
                case actions.hideImage:
                    await hideImage(page, action.id)
                    hideCursor(page)
                    break
                case actions.showDrawing:
                    await showDrawing(page, action.id)
                    break
                case actions.setViewBox:
                    await setViewBox(page, action.value)
                    break
                case actions.moveCursor:
                    await moveCursor(page, 
                        action.value[0] * currentImage.width, 
                        action.value[1] * currentImage.height
                    )
                default:
                    break
            }
        }
        const captureFile = timestamps[i] + '.png'
        await page.screenshot({ path: workdir + '/' + captureFile })
        frame.capture = captureFile
    }

    await browser.close()
}


const showImage = async (page, id) => {
    await page.evaluate((id) => {
        document.querySelector('#' + id).style.visibility = 'visible'
        const canvas = document.querySelector('#canvas' + id.match(/\d/))
        if (canvas) canvas.setAttribute('display', 'block')
    }, id)
}

const hideImage = async (page, id) => {
    await page.evaluate((id) => {
        document.querySelector('#' + id).style.visibility = 'hidden'
        const canvas = document.querySelector('#canvas' + id.match(/\d/))
        if (canvas) canvas.setAttribute('display', 'none')
    }, id)
}

const showDrawing = async (page, id) => {
    await page.evaluate((id) => {
        document.querySelector('#' + id).style.visibility = 'visible'
    }, id)
}

const setViewBox = async (page, viewBox) => {
    await page.evaluate((viewBox) => {
        document.querySelector('#svgfile').setAttribute('viewBox', viewBox)
    }, viewBox)
}

const showCursor = async (page) => {
    await page.evaluate(() => {
        document.querySelector('#cursor').style.visibility = 'visible'
    })
}

const hideCursor = async (page) => {
    await page.evaluate(() => {
        document.querySelector('#cursor').style.visibility = 'hidden'
    })
}

const moveCursor = async (page, x, y) => {
    await page.evaluate((x,y) => {
        document.querySelector('#cursor').setAttribute('cx', x)
        document.querySelector('#cursor').setAttribute('cy', y)
    }, x, y)
}

const renderVideo = async (config, presentation) => {
    const slidesTxtFile = config.workdir + '/slides.txt'
    const videoFile = config.workdir + '/slides.mp4'
    const timestamps = Object.keys(presentation.frames).sort((a, b) => { return 1.0 * a - 1.0 * b })

    let ws = ''
    for (let i = 0; i < timestamps.length - 1; i++) {
        const duration = Math.round(10 * (presentation.frames[timestamps[i + 1]].timestamp - presentation.frames[timestamps[i]].timestamp)) / 10
        ws += "file '" + presentation.frames[timestamps[i]].capture + "'\n"
        ws += "duration " + duration + "\n"
    }
    ws += "file '" + presentation.frames[timestamps.slice(-2)[0]].capture + "'\n"

    fs.writeFileSync(slidesTxtFile, ws)
    childProcess.execSync(`ffmpeg -hide_banner -loglevel error -f concat -i ${slidesTxtFile} -threads 1 -y -filter_complex "[0:v]fps=24, scale=${presentation.viewport.width}:-2[out]" -map '[out]' -strict -2 -crf 22 -pix_fmt yuv420p ${videoFile}`)
    presentation.video = videoFile
}