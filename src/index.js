const { config }  = require('./modules/config')
const { createVideo } = require('./modules/processor')


async function run(config) {
    try {
        const start = Date.now()
        console.log('[Start] Rendering downloadable video for BBB presentation ', config)
    
        await createVideo(config)
        
        const end = Date.now()
        const processTime = (end - start) / 1000
        console.log('[End] Finished rendering downloadable video for BBB presentation in ' + processTime + ' seconds ', config)
    } catch (error) {
        console.error('[Error] Failed rendering downloable video for BBB presentation ', config, error)
    }  
} 

run(config)


