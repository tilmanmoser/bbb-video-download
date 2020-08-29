const del = require('del')
const mkdirp = require('mkdirp')

module.exports.toArray = (obj) => {
    if (Array.isArray(obj)) return obj
    return [obj]
}
module.exports.reCreateDir = async (dir) => {
    await del(dir)
    await mkdirp(dir)
}
module.exports.deleteDir = async (dir) => {
    await del(dir)
}

module.exports.removeTrailingSlash = (dir) => {
    return (dir.substring(-1) === '/') ? dir.substring(0, dir.length - 1) : dir
}