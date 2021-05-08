import { parentPort, workerData } from 'node:worker_threads'
import { getHeaderClass } from './utils.mjs'

const { module, commonHeaderKeys } = workerData

const HeaderClass = getHeaderClass(module)

const startTime = process.hrtime.bigint()

const headers = new HeaderClass()

for (const key of commonHeaderKeys) {
  headers.append(key, 'A-String-Value-That-Represents-Average-Header-Value-Length')
}

const endTime = process.hrtime.bigint()

parentPort.postMessage({
  operation: 'append',
  module,
  startTime,
  endTime
})

process.exit(0)
