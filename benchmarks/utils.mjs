function calcElapsedTime (timing) {
  return Number.parseFloat(timing.endTime - timing.startTime)
}

function elapsedTimeToString (key, elapsedTime) {
  return `${key.padEnd(25)} | total time: ${elapsedTime}ns (${(elapsedTime * 0.000001).toFixed(3)}ms)`
}

function calcPercentChange (base, elapsedTime) {
  return ((base - elapsedTime) / elapsedTime) * 100
}

function percentChangeToString (key, percent) {
  return `undici-fetch <> ${key} percent change: ${percent.toFixed(3)}%`
}

export {
  calcElapsedTime,
  elapsedTimeToString,
  calcPercentChange,
  percentChangeToString
}