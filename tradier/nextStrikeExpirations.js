const network = require('../utils/network')
const logUtil = require('../utils/log')

// Failover function
const _nextStrikeDates = (maxWeeksOut = 4) => {
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


const nextStrikeExpirations = async (symbol, limit = 2) => {
  try {
    if (limit === 0) {
      return []
    }

    const url = `/v1/markets/options/expirations?symbol=${symbol}`
    const response = await network.get(url)
    
    // Tradier has this annoying tendency to return a single object rather than an array if there is one return value
    // This should never happen with expirations, so I'm not doing the usual Array.isArray thing
    const currentDate = new Date().toISOString().split('T')[0]
    const dates = response.expirations.date.filter(x => x != currentDate)

    // These symbols have multiple expirations per week
    if ([ 'SPY', 'IWM', 'QQQ' ].includes(symbol)) {
      return [ dates[0] ]
    }

    return dates.slice(0, limit)
  } catch (e) {
    logUtil.log({
      type: 'error',
      message: e.toString()
    })

    return _nextStrikeDates(limit)
  }
}


module.exports = {
  _nextStrikeDates,
  nextStrikeExpirations
}