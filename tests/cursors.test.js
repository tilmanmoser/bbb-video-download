const { parseCursors, extractCursorsBetween, Cursor } = require('../modules/cursors')
const fs = require('fs')

describe("parsing cursor.xml", () => {

    test("parseCursors(empty.xml) should return an empty array", async() => {
        let cursors = await parseCursors(fs.readFileSync('./tests/cursors/empty.xml').toString())
        expect(cursors.length).toBe(0)
    })

    test("parseCursors(single.xml) should return an array with a single cursor", async() => {
        let cursors = await parseCursors(fs.readFileSync('./tests/cursors/single.xml').toString())
        expect(cursors.length).toBe(1)
        expect(cursors[0].x).toBe(-1)
        expect(cursors[0].y).toBe(-1)
        expect(cursors[0].start).toBe(0)
    })

    test("parseCursors(multi.xml) should return an array with 15 elements", async() => {
        let cursors = await parseCursors(fs.readFileSync('./tests/cursors/multi.xml').toString())
        expect(cursors.length).toBe(15)
    })

    test("extractCursorsBetween() should return only cursors in time frame", async() => {
        let cursors = await parseCursors(fs.readFileSync('./tests/cursors/multi.xml').toString())
        let cursorsBetween = extractCursorsBetween(cursors, 3.0, 4.0)
        expect(cursorsBetween.length).toBe(7)
        expect(cursorsBetween[0].start).toBe(3.0)
    })

    test("Cusor.mapToViewport(w,h) should return concrete coordinates", async() => {
        let cursor = new Cursor(0.5,0.5,0.0)
        let coords = cursor.mapToViewport(1200,600,1200,600)
        expect(coords.x).toBe(600)
        expect(coords.y).toBe(300)
    })

})