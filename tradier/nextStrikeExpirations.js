const network = require('../utils/network')
const logUtil = require('../utils/log')

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

    return []
  }
}


module.exports = {
  nextStrikeExpirations
}