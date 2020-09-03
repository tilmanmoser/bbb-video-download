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
            
            if (fs.existsSync(this.inputDir + '/deskshare/deskshare.mp4'))
                this.deskshareVideo = this.inputDir + '/deskshare/deskshare.mp4'
            else if (fs.existsSync(this.inputDir + '/deskshare/deskshare.webm'))
                this.deskshareVideo = this.inputDir + '/deskshare/deskshare.webm'

            if (fs.existsSync(this.inputDir + '/video/webcams.mp4'))
                this.webcamsVideo = this.inputDir + '/video/webcams.mp4'
            else if (fs.existsSync(this.inputDir + '/video/webcams.webm'))
                this.webcamsVideo = this.inputDir + '/video/webcams.webm'

        } catch (error) {
            throw error
        }
    }

    async createAssets() {
        try {
            this.workdir = './tmp/' + this.metadata.id
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
            throw error
        }
    }

    async createVideo() {
        try {
            let cmd = await assembleFfmpegCmd(this)
            console.log(cmd)
            childProcess.execSync(cmd)
        } catch (error) {
            throw error
        }

    }

    async cleanup() {
        try {
            deleteDir(this.workdir)
        } catch (erorr) {
            throw error
        }
        
    }
 
    async verify() {
        try {
            if (fs.existsSync(this.args.output))
                console.log(`Success. Created ${this.args.output}`)
            else    
                console.log('Failed to create video')
        } catch (erorr) {
            throw error
        }
    }

}

module.exports.Processor = Processor
