const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')

function printResults (results, n) {
  console.log(`Results for Header append:`)
  const baselineTiming = Number.parseInt(results['undici-fetch'].endTime - results['undici-fetch'].startTime)
  for (const [ key, timing ] of Object.entries(results)) {
    const elapsedTT = Number.parseFloat(timing.endTime - timing.startTime)
    console.log(`${key.padEnd(25)} | total time: ${elapsedTT}ns (${(elapsedTT * 0.000001).toFixed(3)}ms)`)
  }
  console.log('---')
  for (const [ key, timing ] of Object.entries(results)) {
    if (key === 'undici-fetch') continue
    const elapsedTT = Number.parseFloat(timing.endTime - timing.startTime)
    const percent = ((baselineTiming - elapsedTT) / elapsedTT) * 100
    console.log(`undici-fetch <> ${key} percent change: ${percent.toFixed(3)}%`)
  }
}

if (isMainThread) {
  /** Sorted list of common header keys */
  const commonHeaderKeys = [
    'A-IM',
    'Accept',
    'Accept-Charset',
    'Accept-Datetime',
    'Accept-Encoding',
    'Accept-Language',
    'Accept-Patch',
    'Accept-Ranges',
    'Access-Control-Request-Headers',
    'Access-Control-Request-Method',
    'Age',
    'Allow',
    'Alt-Svc',
    'Authorization',
    'Cache-Control',
    'Connection',
    'Content-Disposition',
    'Content-Encoding',
    'Content-Language',
    'Content-Length',
    'Content-Location',
    'Content-Range',
    'Content-Type',
    'Cookie',
    'Date',
    'Delta-Base',
    'ETag',
    'Expect',
    'Expires',
    'Forwarded',
    'From',
    'Host',
    'IM',
    'If-Match',
    'If-Modified-Since',
    'If-None-Match',
    'If-Range',
    'If-Unmodified-Since',
    'Last-Modified',
    'Link',
    'Location',
    'Max-Forwards',
    'Origin',
    'Pragma',
    'Proxy-Authenticate',
    'Proxy-Authorization',
    'Public-Key-Pins',
    'Range',
    'Referer',
    'Retry-After',
    'Server',
    'Set-Cookie',
    'Strict-Transport-Security',
    'TE',
    'Tk',
    'Trailer',
    'Transfer-Encoding',
    'Upgrade',
    'User-Agent',
    'Vary',
    'Via',
    'WWW-Authenticate',
    'Warning'
  ]

  /** Shuffle list for accurate sorting benchmarks */
  commonHeaderKeys.sort(() => Math.random() - 0.5)

  const spawnWorker = headerType => new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { headerType, commonHeaderKeys }
    })
    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', code => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })

  Promise.all([
    spawnWorker('undici-fetch', commonHeaderKeys),
    spawnWorker('node-fetch', commonHeaderKeys)
  ]).then(values => {
    const results = {}
    for (const { headerType, startTime, endTime } of values) {
      results[headerType] = { startTime, endTime }
    }
    console.log(results)
    printResults(results)
  })
} else {
  const { headerType, commonHeaderKeys } = workerData
  let HeaderClass = null
  switch(headerType) {
    case 'undici-fetch': {
      HeaderClass = require('../src/headers').Headers
      break
    }
    case 'node-fetch': {
      HeaderClass = require('node-fetch').Headers
      break
    }
    default: {
      throw Error(`Invalid header class type ${headerType}`)
    }
  }


  const startTime = process.hrtime.bigint()

  const headers = new HeaderClass()

  for (const key of commonHeaderKeys) {
    headers.append(key, 'standard-value')
  }

  const endTime = process.hrtime.bigint()

  parentPort.postMessage({
    headerType,
    startTime,
    endTime
  })
  process.exit(1)
}