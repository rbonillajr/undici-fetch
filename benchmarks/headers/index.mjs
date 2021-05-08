import { Worker } from 'node:worker_threads'
import { commonHeaderKeys } from './utils.mjs'
import {
  calcElapsedTime,
  calcPercentChange,
  percentChangeToString,
  totalTimeToString
} from '../utils.mjs'

function printBenchmarkSuite (operation, benchmarks) {
  console.log(`Benchmark Suite results for operation: ${operation}`)
  const baselineTiming = calcElapsedTime(benchmarks['undici-fetch'])
  const output = Object.entries(benchmarks).map(([module, timings]) => {
    const totalTime = calcElapsedTime(timings)
    const percentChange = module === 'undici-fetch' ? null : calcPercentChange(baselineTiming, calcElapsedTime(timings))
    return {
      Module: module,
      'Total Time': totalTimeToString(totalTime),
      'Percent Change': percentChange !== null ? percentChangeToString(percentChange) : null
    }
  })
  console.table(output)
}
function printResults (results) {
  console.log('Benchmark results for Headers class')
  console.log(`Tested modules: ${results.modules.join(', ')}\n`)

  for (const [operation, benchmarks] of Object.entries(results.benchmarks)) {
    printBenchmarkSuite(operation, benchmarks)
  }
}

/** Shuffle list for accurate sorting benchmarks */
commonHeaderKeys.sort(() => Math.random() - 0.5)

function spawnWorker (operation, module, commonHeaderKeys) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(`./${operation}.mjs`, import.meta.url), {
      workerData: { module, commonHeaderKeys }
    })
    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', code => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
}

Promise.all([
  spawnWorker('append', 'undici-fetch', commonHeaderKeys),
  spawnWorker('append', 'node-fetch', commonHeaderKeys),
  spawnWorker('iterate', 'undici-fetch', commonHeaderKeys),
  spawnWorker('iterate', 'node-fetch', commonHeaderKeys)
]).then(values => {
  const results = values.reduce((acc, { operation, module, ...rest }) =>
    ({
      ...acc,
      modules: [...(new Set([...acc.modules, module]))],
      benchmarks: {
        ...acc.benchmarks,
        [operation]: {
          ...acc.benchmarks[operation],
          [module]: rest
        }
      }
    }),
  { modules: [], benchmarks: {} }
  )
  printResults(results)
}).catch(error => {
  console.error(error)
  process.exit(1)
})
