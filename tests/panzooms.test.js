const fs = require('fs')
const { parsePanzooms, extractZoomsBetween } = require('../modules/panzooms')

describe("parsing panzooms.xml", () => {

    test("parsePanzooms(empty.xml) should return an empty array", async() => {
        let zooms = await parsePanzooms(fs.readFileSync('./tests/zooms/empty.xml').toString())
        expect(zooms.length).toBe(0)
    })

    test("parsePanzooms(single.xml) should return an array with a single zoom", async() => {
        let zooms = await parsePanzooms(fs.readFileSync('./tests/zooms/single.xml').toString())
        expect(zooms.length).toBe(1)
        expect(Math.abs(zooms[0].x)).toBe(0)
        expect(Math.abs(zooms[0].y)).toBe(0)
        expect(zooms[0].w).toBe(1600)
        expect(zooms[0].h).toBe(900)
        expect(zooms[0].start).toBe(0)
    })

    test("parsePanzooms(multi.xml) should return an array with 9 elements", async() => {
        let zooms = await parsePanzooms(fs.readFileSync('./tests/zooms/multi.xml').toString())
        expect(zooms.length).toBe(9)
    })

    test("extractZoomsBetween() should return only zooms in time frame", async() => {
        let zooms = await parsePanzooms(fs.readFileSync('./tests/zooms/multi.xml').toString())
        let zoomsBetween = extractZoomsBetween(zooms, 151.3,152)
        expect(zoomsBetween.length).toBe(3)
        expect(zoomsBetween[0].start).toBe(151.3)
        expect(zoomsBetween[1].start).toBe(151.4)
        expect(zoomsBetween[1].end).toBe(151.6)
        expect(zoomsBetween[2].end).toBe(152)
    })

    test("extractZoomsBetween() last zoom should end with slide", async() => {
        let zooms = await parsePanzooms(fs.readFileSync('./tests/zooms/multi.xml').toString())
        let zoomsBetween = extractZoomsBetween(zooms, 153.7,160)
        expect(zoomsBetween.length).toBe(1)
        expect(zoomsBetween[0].start).toBe(153.7)
        expect(zoomsBetween[0].end).toBe(153.8)
    })

  

})