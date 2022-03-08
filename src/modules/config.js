require('dotenv').config()
const { ArgumentParser } = require('argparse');
const { version } = require('../package.json')
const { description } = require('../package.json')
const fs = require('fs')

const parser = new ArgumentParser({
  description: description
});

parser.add_argument('-v', '--version', { action: 'version', version })
parser.add_argument('-i', '--input', { help: 'path to BigBlueButton published presentation', required: true })
parser.add_argument('-o', '--output', { help: 'path to outfile', required: true })
parser.add_argument('-ow', '--width', { help: 'width of output file', type: 'int', default: 1280 })
parser.add_argument('-oh', '--height', { help: 'height of output file', type: 'int', default: 720 })
parser.add_argument('-q', '--quality', { help: 'deviceScaleFactor of Chrome', type: 'int', default: 2  })
parser.add_argument('--threads', { help: 'ffmpeg threads', type: 'int', default: 1 })
parser.add_argument('--combine', { help: 'combine presentation and webcams', action:ArgumentParser.BooleanOptionalAction, default: true })
parser.add_argument('--isOnlyAudio', { help: 'overwrite isOnlyAudio to skip isAllWhiteVideo check', action:ArgumentParser.BooleanOptionalAction })

const arguments = parser.parse_args()
validateArguments(arguments)

module.exports.config = {
  args: arguments,
  format: arguments.output.split('.').pop(),
  docker: fs.existsSync('/.dockerenv')
}

function validateArguments (arguments) {
  if (!arguments.output.endsWith('.mp4') && !arguments.output.endsWith('.webm'))
    throw new Error('Unsupported file type: ' + arguments.output)
  

}


