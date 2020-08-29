const fs = require('fs')
const childProcess = require('child_process')
const { extractCursorsBetween } = require("./cursors")
const { extractZoomsBetween } = require("./panzooms")

module.exports.createFfMetadataFile = async (file, meta, shapes, deskshares) => {
    let chapters = []
    let presentation = null
    let presentationCount = 0, slideCount = 0
    shapes.forEach(shape => {
        let presentationFile = shape.file.substring(0, shape.file.lastIndexOf('/'))
        if (presentationFile != presentation) {
            presentation = presentationFile
            presentationCount++
            slideCount = 0
        }
        slideCount++
        chapters.push({ 
            title: `Slide ${presentationCount}.${slideCount}`,
            start: shape.start,
            end: shape.end
        })
    })
    deskshares.forEach((share, index) => {
        chapters.push({
            title:`Deskshare ${index+1}`,
            start: share.start,
            end: share.end
        })
    })
    chapters.sort((a,b)=>a.start - b.start)

    let chapterMarks = `;FFMETADATA1\ntitle=${meta.name} (${meta.start.toLocaleString()})\n`
    chapters.forEach((chapter,index) => {
        if (index === 0 && chapter.start > 0)
            chapterMarks += `[CHAPTER]\nTIMEBASE=1/1000\nSTART=0\nEND=${chapter.start*1000}\ntitle=Start\n`    
        chapterMarks += `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${chapter.start*1000}\nEND=${chapter.end*1000}\ntitle=${chapter.title}\n`
    })
    fs.writeFileSync(file, chapterMarks)

}

module.exports.assembleFfmpegCmd = async (options) => {

    let inputs = []
    let filters = []
    let maps = []

    if (options.canvasFile) {
        inputs.push(options.canvasFile)
        filters.push(`[0:v]scale=${options.canvasDimensions.width}:-2[v1]`)

        if (options.shapes.length > 0) {
            options.shapes.forEach(slide => {
                // overlay slide
                inputs.push(options.inputDir + '/' + slide.file)
                filters.push(`[${inputs.length - 1}][v${filters.length}]scale2ref=w=oh*mdar:h=ih[overlay${filters.length}][source${filters.length}];[source${filters.length}][overlay${filters.length}]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:enable='between(t,${slide.start},${slide.end})'[v${filters.length + 1}]`)
                // overlay whiteboards
                slide.whiteboards.forEach(shape => {
                    inputs.push(options.shapeFiles[shape.id])
                    filters.push(`[${inputs.length - 1}][v${filters.length}]scale2ref=w=oh*mdar:h=ih[overlay${filters.length}][source${filters.length}];[source${filters.length}][overlay${filters.length}]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:enable='between(t,${shape.start},${slide.end})'[v${filters.length + 1}]`)
                })
                // overlay cursors
                let cursors = extractCursorsBetween(options.cursors, slide.start, slide.end) 
                cursors.forEach(cursor => {
                    let dims = cursor.mapToViewport(options.canvasDimensions.width, options.canvasDimensions.height, slide.width, slide.height)
                    let w = 10, x = Math.max(0, dims.x-w/2), y = Math.max(0, dims.y-w/2)
                    if (x > 0 || y > 0)
                        filters.push(`[v${filters.length}]drawbox=x=${x}:y=${y}:w=${w}:h=${w}:color=red:t=fill:enable='between(t,${cursor.start},${cursor.end})'[v${filters.length + 1}]`)
                })
                // overlay zooms
                let zooms = extractZoomsBetween(options.panzooms, slide.start, slide.end)
                zooms.forEach(zoom => {
                    let dims = zoom.mapToViewport(options.canvasDimensions.width, options.canvasDimensions.height, slide.width, slide.height)
                    let scale = (dims.isLandscape) ? `${options.canvasDimensions.width}:-2`: `-2:${options.canvasDimensions.height}`
                    filters.push(`[v${filters.length}]split[va${filters.length}][vb${filters.length}];[vb${filters.length}]trim=${zoom.start}:${zoom.end},crop=w=${dims.width}:h=${dims.height}:x=${dims.x}:y=${dims.y},scale=${scale}[zoom${filters.length}];[va${filters.length}][zoom${filters.length}]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:enable='between(t,${zoom.start},${zoom.end})'[v${filters.length + 1}]`)
                })
            })
        }

        if (options.deskshares.length > 0 && options.deskshareVideo) {
            inputs.push(options.deskshareVideo)
            // overlay deskhare sequences
            options.deskshares.forEach(share => {
                filters.push(`[${inputs.length - 1}]trim=${share.start}:${share.end}[trimmed${filters.length}];[trimmed${filters.length}][v${filters.length}]scale2ref=w=oh*mdar:h=ih[overlay${filters.length}][source${filters.length}];[source${filters.length}][overlay${filters.length}]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:enable='between(t,${share.start},${share.end})'[v${filters.length + 1}]`)
            })
        }
        
    }

    inputs.push(options.webcamsVideo)
    if (inputs.length === 1) {
        // video has no presentation and deskshare
        maps.push(`-map 0 -c:v libx264 -c:a copy`)
    } else {
        if (! await isAllWhite(options.webcamsVideo, options.metadata.duration)) {
            // webcams video is not entirely white
            filters.push(`[v${filters.length}]scale=1280:-2,pad=width=1920:height=ih:color=#FFFFFF[v${filters.length + 1}]`)
            filters.push(`[${inputs.length - 1}]scale=640:-2[overlay${filters.length}];[v${filters.length}][overlay${filters.length}]overlay=x=1280:y=0[v${filters.length + 1}]`)
        }
        maps.push(`-map [v${filters.length}] -c:v libx264`)
        maps.push(`-map ${inputs.length - 1}:a -c:a copy`)
    }


    if (options.captionFiles) {
        options.captionFiles.forEach((caption, index) => {
            inputs.push(caption.file)
            maps.push(`-map ${inputs.length - 1}:s -metadata:s:s:${index} language=${caption.lang}`)
        })
        maps.push('-c:s mov_text')
    }

    inputs.push(options.ffmetadataFile)
    maps.push(`-map_metadata ${inputs.length-1}`)

    let cmd = "ffmpeg \\\n"
    inputs.forEach(input => { cmd += `-i ${input} \\\n` })
      if (filters.length > 0) 
        cmd += "-filter_complex \"" + filters.join("; \\\n") + "\" \\\n"
    maps.forEach(map => { cmd += map + " \\\n" })
    cmd += `${options.args.output} -y`
    
    return cmd
}

const isAllWhite = async (video, duration) => {
    try {
        let whiteframes = childProcess.execSync(`ffmpeg -i ${video} -vf "negate,blackdetect=d=2:pix_th=0.00" -an -f null - 2>&1 | grep blackdetect`).toString()
        let whiteduration = 1.0 * whiteframes.split("\n")[0].match(/black_duration:([^\s]*)/)[1]
        if (Math.abs(duration - whiteduration) < 1)
            return true
    } catch (error) {
        // ignore since childprocess fails when there are no white sequences
    }
    return false
}