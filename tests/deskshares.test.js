const fs = require('fs')
const { parseDeskshares } = require("../modules/deskshares")

describe("parsing deskshare.xml", () => {
    test("parseDeskshares(empty.xml) should return an empty array", async() => {
        let shares = await parseDeskshares(fs.readFileSync('./tests/deskshares/empty.xml').toString())
        expect(shares.length).toBe(0)
    })

    test("parseDeskshares(single.xml) should return an array with a single deskshare", async() => {
        let shares = await parseDeskshares(fs.readFileSync('./tests/deskshares/single.xml').toString())
        expect(shares.length).toBe(1)
        expect(shares[0].start).toBe(10)
        expect(shares[0].end).toBe(20)
    })

    test("parseDeskhares(multi.xml) should return an array with 2 elements", async() => {
        let shares = await parseDeskshares(fs.readFileSync('./tests/deskshares/multi.xml').toString())
        expect(shares.length).toBe(2)
    })

})