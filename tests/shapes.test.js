const {Line,Circle,Path,MultilineText,SVG,parseShapes} = require('../modules/shapes')
const del = require('del')
const mkdirp = require('mkdirp')
const fs = require('fs')
const imageSize = require('image-size')
const { toMatchImageSnapshot } = require('jest-image-snapshot');
expect.extend({ toMatchImageSnapshot })

describe('parsing shapes.svg', () => {
    const dir = './tmp/shapes'
    beforeAll(async() => {
        await del(dir)
        await mkdirp(dir)
    })

    afterAll(async() => {
        await del(dir)
    })

    test('Line.toSVG() should return a svg line element', () => {
        const line = new Line(10,20,30,40,'color:red')
        expect(line.toSVG()).toBe('<line x1="10" y1="20" x2="30" y2="40" style="color:red" />')
    })
    
    test('Circle.toSVG() should return a svg circle element', () => {
        const circle = new Circle(10,20,30,'color:red')
        expect(circle.toSVG()).toBe('<circle cx="10" cy="20" r="30" style="color:red" />')
    })
    
    test('Path.toSVG() should return a svg path element', () => {
        const path = new Path('M 0 0 l 20 20 Z','t:fill')
        expect(path.toSVG()).toBe('<path d="M 0 0 l 20 20 Z" style="t:fill" />')
    })
        
    test('MultilineText.toSVG() should return a svg switch element with a html paragraph', () => {
        const text = new MultilineText(10,20,30,40,'hello world','color:red')
        expect(text.toSVG()).toBe('<switch><foreignObject x="10" y="20" width="30" height="40"><p xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;color:red">hello world</p></foreignObject></switch>')
    })
    
    test('SVG.addShape() should accept a shape', () => {
        const svg = new SVG(1600,900)
        expect(svg.shapes.length).toBe(0)
        svg.addShape(new Circle(10,20,30))
        expect(svg.shapes.length).toBe(1)
    })
    
    test('SVG.toSVG() should return a svg-string with shapes', () => {
        const svg = new SVG(1600,900).addShape(new Circle(10,20,30)).addShape(new Circle(40,50,60))
        expect(svg.toSVG()).toBe(
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="900" background="rgba(255,255,255,1)">' +
            '<circle cx="10" cy="20" r="30" style="" />' +
            '<circle cx="40" cy="50" r="60" style="" />' +
            '</svg>'
        )
    })
    
    test('SVG.toPNG() should create a png image', async () => {
        let svg = new SVG(100,100).addShape(new Circle(50,50,50))
        let img = await svg.toPNG('tmp/svg.png')
        expect(imageSize(img)).toEqual({
            type: 'png',
            width: 100,
            height: 100
        })
        expect(img).toMatchImageSnapshot()   
    })

    test('parseShapes(invalid.svg) should throw an error', async () => {
        let error = null
        try {
            await parseShapes(fs.readFileSync('./tests/shapes/invalid.svg').toString())
        } catch (err) {
            error = err
        }
        expect(error).toBeTruthy()
    })

    test('parseShapes(empty.svg) should return an empty array', async () => {
        let obj = await parseShapes(fs.readFileSync('./tests/shapes/empty.svg').toString())
        expect(obj.length).toBe(0)
    })

    test('parseShapes(logo.svg) should return an empty array', async () => {
        let obj = await parseShapes(fs.readFileSync('./tests/shapes/logo.svg').toString())
        expect(obj.length).toBe(0)
    })

    test('parseShapes(singleshape.svg) should return an object with a single image and a single shape', async () => {
        let obj = await parseShapes(fs.readFileSync('./tests/shapes/singleshape.svg').toString(), 40)
        expect(obj.length).toBe(1)
        expect(obj[0].id).toBe('image1')
        expect(obj[0].width).toBe(1600)
        expect(obj[0].height).toBe(900)
        expect(obj[0].start).toBe(0.0)
        expect(obj[0].end).toBe(34.3)
        expect(obj[0].whiteboards.length).toBe(1)
        expect(obj[0].whiteboards[0].start).toBe(22.3)
        expect(obj[0].whiteboards[0].shape.x1).toBe(10)
        expect(obj[0].whiteboards[0].shape.y1).toBe(10)
        expect(obj[0].whiteboards[0].shape.x2).toBe(20)
        expect(obj[0].whiteboards[0].shape.y2).toBe(20)
    })

    test('parseShapes(multishape.svg) should return only the latest drawn shape', async () => {
        let obj = await parseShapes(fs.readFileSync('./tests/shapes/multishape.svg').toString())
        expect(obj.length).toBe(1)
        expect(obj[0].whiteboards[0].start).toBe(28.3)
        expect(obj[0].whiteboards[0].shape.x1).toBe(10)
        expect(obj[0].whiteboards[0].shape.y1).toBe(10)
        expect(obj[0].whiteboards[0].shape.x2).toBe(40)
        expect(obj[0].whiteboards[0].shape.y2).toBe(40)
    })



    test('parseShapes(multislide.svg) should return 4 slides with the latest drawn shapes', async () => {
        let obj = await parseShapes(fs.readFileSync('./tests/shapes/multislide.svg').toString())
        expect(obj.length).toBe(4)
        expect(obj[1].whiteboards.length).toBe(6)
        expect(obj[3].whiteboards.length).toBe(6)
        expect(obj[3].start).toBe(obj[3].whiteboards[0].start)        
    })

    test('Shapes should not start before slide', async () => {
        let obj = await parseShapes(fs.readFileSync('./tests/shapes/multislide.svg').toString())
        expect(obj[3].start).toBe(obj[3].whiteboards[0].start)        
    })


})