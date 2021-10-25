const nextStrikeDates = (maxWeeksOut = 4) => {
  const date = new Date()
  const dates = []

  while(dates.length < maxWeeksOut) {
    switch (date.getDay()) {
    case 0: date.setDate(date.getDate() + 5)
      break
    case 1: date.setDate(date.getDate() + 4)
      break
    case 2: date.setDate(date.getDate() + 3)
      break
    case 3: date.setDate(date.getDate() + 2)
      break
    case 4: date.setDate(date.getDate() + 1)
      break
    case 5: date.setDate(date.getDate() + 7) // Off to next friday
      break
    case 6: date.setDate(date.getDate() + 6)
      break
    }
    // ISO string returns zulu time and can screw up the date
    const offset = date.getTimezoneOffset()
    const actualDate = new Date(date.getTime() - (offset*60*1000))
    dates.push(actualDate.toISOString().split('T')[0])
  }

  return dates
}

module.exports = nextStrikeDates