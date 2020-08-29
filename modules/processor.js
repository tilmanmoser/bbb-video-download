const fs = require('fs')
const del = require('del')
const mkdirp = require('mkdirp')
const childProcess = require('child_process')
const { parseShapes, SVG, getDimensionsOfWidestShape, Path, createShapes, createCanvas } = require('./shapes')
const { parseCursors } = require('./cursors')
const { parseDeskshares } = require('./deskshares')
const { parsePanzooms } = require('./panzooms')
const { parseMetadata } = require('./metadata')
const { parseCaptions, createCaptions } = require('./captions')
const { createFfMetadataFile, assembleFfmpegCmd } = require('./ffmpeg')
const { reCreateDir: createWorkdir, deleteDir, removeTrailingSlash } = require('./util')

class Processor {
    constructor(args) {
        this.args = args
        this.inputDir = removeTrailingSlash(args.input)
    }

    async configure() {
        try {
            this.metadata = await parseMetadata(fs.readFileSync(this.inputDir + '/metadata.xml').toString())
            this.shapes = await parseShapes(fs.readFileSync(this.inputDir + '/shapes.svg').toString(), this.metadata.duration)
            this.cursors = await parseCursors(fs.readFileSync(this.inputDir + '/cursor.xml').toString())
            this.deskshares = await parseDeskshares(fs.readFileSync(this.inputDir + '/deskshare.xml').toString())
            this.panzooms = await parsePanzooms(fs.readFileSync(this.inputDir + '/panzooms.xml').toString())
            this.captions = await parseCaptions(fs.readFileSync(this.inputDir + '/captions.json').toString())
            if (fs.existsSync(this.inputDir + '/deskshare/'))
                this.deskshareVideo = this.inputDir + '/deskshare/' + fs.readdirSync(this.inputDir + '/deskshare/').values().next().value
            if (fs.existsSync(this.inputDir + '/video/'))
                this.webcamsVideo = this.inputDir + '/video/' + fs.readdirSync(this.inputDir + '/video/').values().next().value
        } catch (error) {
            console.error(error)
            throw new Error(error)
        }
    }

    async createAssets() {
        try {
            this.workdir = this.inputDir + '/assets'
            await createWorkdir(this.workdir)
            this.shapeFiles = await createShapes(this.shapes, this.workdir),
            this.captionFiles = await createCaptions(this.captions, this.inputDir, this.workdir)
            if (this.shapes.length > 0) {
                this.canvasDimensions = getDimensionsOfWidestShape(this.shapes)
                this.canvasFile = await createCanvas(this.canvasDimensions, this.metadata.duration, this.workdir)
            }
            this.ffmetadataFile = this.workdir + '/ffmetadata.txt'
            await createFfMetadataFile(this.ffmetadataFile, this.metadata, this.shapes, this.deskshares)
        } catch (error) {
            console.error(error)
            throw new Error(error)
        }
    }

    async createVideo() {
        try {
            let cmd = await assembleFfmpegCmd(this)
            console.log(cmd)
            childProcess.execSync(cmd)
        } catch (error) {
            console.error(error)
            throw new Error(error)
        }

    }

    async cleanup() {
        try {
            deleteDir(this.workdir)
        } catch (erorr) {
            console.error(error)
            throw new Error(error)
        }
        
    }
 
}

module.exports.Processor = Processor
