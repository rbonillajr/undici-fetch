import { parentPort, workerData } from 'node:worker_threads'
import { getHeaderClass } from './utils.mjs'

const { module, commonHeaderKeys } = workerData

const HeaderClass = getHeaderClass(module)

const headers = new HeaderClass()

for (const key of commonHeaderKeys) {
  headers.append(key, 'A-String-Value-That-Represents-Average-Header-Value-Length')
}

// const sortedAndNormalizedCommonHeaderKeys = commonHeaderKeys.sort().map(name => name.toLowerCase())

const startTime = process.hrtime.bigint()
const noop = () => {}

for (const header of headers) {
  noop(header)
  // node-fetch doesn't sort correctly, so don't error out: https://github.com/node-fetch/node-fetch/issues/1119
  // const expectedHeaderName = sortedAndNormalizedCommonHeaderKeys[i]
  // if (key !== expectedHeaderName) throw new Error(`Invalid sort from module ${module}. Expected: ${expectedHeaderName} | Found: ${key}`)
}

const endTime = process.hrtime.bigint()

parentPort.postMessage({
  operation: 'iterate',
  module,
  startTime,
  endTime
})

process.exit(0)
