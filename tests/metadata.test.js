const fs = require('fs')
const { parseMetadata } = require('../modules/metadata')

describe("parse metatdata.xml", () => {
    test("parseMetadata(metadata.xml) should return information about the presentation", async() => {
        let metadata = await parseMetadata(fs.readFileSync('./tests/metadata/metadata.xml').toString())
        expect(metadata.id).toBe('9a9b6536a10b10017f7e849d30a026809852d01f-1598364581253')
        expect(metadata.name).toBe('Featuredemo')
        expect(metadata.start).toEqual(new Date(1598364581253))
        expect(metadata.end).toEqual(new Date(1598364606662))
        expect(metadata.duration).toBe(9.566)
    })
})