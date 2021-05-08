function calcElapsedTime (timing) {
  return Number.parseFloat(timing.endTime - timing.startTime)
}

function elapsedTimeToString (key, elapsedTime) {
  return `${key.padEnd(10)} | total time: ${elapsedTime}ns (${(elapsedTime * 0.000001).toFixed(3)}ms)`
}

function totalTimeToString (totalTime) {
  return `${totalTime}ns (${(totalTime * 0.000001).toFixed(3)}ms)`
}

function calcPercentChange (base, elapsedTime) {
  return ((base - elapsedTime) / elapsedTime) * 100
}

function percentChangeToString (percentChange) {
  return `${percentChange.toFixed(3)}%`
}

export {
  calcElapsedTime,
  elapsedTimeToString,
  calcPercentChange,
  percentChangeToString,
  totalTimeToString
}
