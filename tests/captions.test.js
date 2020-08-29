const fs = require('fs')
const { parseCaptions } = require('../modules/captions')

describe("parse captions.json", () => {
    test("parseCaptions(empty.json) should return an empty array", async() => {
        let captions = await parseCaptions(fs.readFileSync('./tests/captions/empty.json'))
        expect(captions.length).toBe(0)
    })

    test("parseCaptions(single.json) should return an array with one element", async() => {
        let captions = await parseCaptions(fs.readFileSync('./tests/captions/single.json'))
        expect(captions.length).toBe(1)
        expect(captions[0].language).toBe('Deutsch')
        expect(captions[0].code1).toBe('de')
        expect(captions[0].code2).toBe('deu')
    })

    test("parseCaptions(multi.json) should return an array with 2 elements", async() => {
        let captions = await parseCaptions(fs.readFileSync('./tests/captions/multi.json'))
        expect(captions.length).toBe(2)
    })

})