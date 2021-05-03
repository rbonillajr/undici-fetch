import {
  calcElapsedTime,
  elapsedTimeToString,
  calcPercentChange,
  percentChangeToString
} from './utils.mjs'

import { createRequire } from 'node:module'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'

function printResults (results, n) {
  console.log('Results for Header append:')
  const baselineTiming = calcElapsedTime(results['undici-fetch'])
  for (const [key, timing] of Object.entries(results)) {
    console.log(elapsedTimeToString(key, calcElapsedTime(timing)))
  }
  console.log('---')
  for (const [key, timing] of Object.entries(results)) {
    if (key === 'undici-fetch') continue
    console.log(percentChangeToString(key, calcPercentChange(baselineTiming, calcElapsedTime(timing))))
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
    const worker = new Worker(new URL(import.meta.url), {
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
  const require = createRequire(import.meta.url)
  switch (headerType) {
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
  process.exit(0)
}
