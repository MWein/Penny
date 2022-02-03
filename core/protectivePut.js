const positionsUtil = require('../tradier/getPositions')
const {
  getUnderlying
} = require('../utils/determineOptionType')


// Daily and weekly frequency stops should be handled in _getOrderInstructionsFromSetting
const _determinePutsToReplace = (setting, currentPositions) => {
  const {
    symbol,
    enabled,
    number,
    frequency,
  } = setting

  if (number === 0 || !enabled) {
    return []
  }

  // Filter for puts with symbol and protective puts
  const protectivePuts = positionsUtil
    .filterForLongPutPositions(currentPositions)
    .filter(x => getUnderlying(x.symbol) === symbol)

  // The quantity on some positions will be greater than 1
  // Turns { symbol: 'AAPL', quantity: 2 } to [ { symbol: 'AAPL', quantity: 1 }, { symbol: 'AAPL', quantity: 1 } ]
  const spreadOutPuts = protectivePuts.reduce((acc, pos) =>
    [
      ...acc,
      ...Array.apply(null, Array(pos.quantity)).map(() => ({ ...pos, quantity: 1 }))
    ], [])

  // Check how many brand new positions we need
  const additionalSymbolsToAdd = Math.max(number - spreadOutPuts.length, 0)

  // If the number of positions is higher than setting.number, filter for newest
  const newestPuts = spreadOutPuts.sort((a, b) => new Date(a) - new Date(b)).slice(number * -1)

  // If setting.frequency is monthly, filter out positions less than 30 days old
  const today = new Date()
  const positionsOlderThan30 = frequency === 'monthly' ?
    newestPuts.filter(x => {
      const diffInDays = (today.getTime() - new Date(x.date_acquired).getTime()) / (1000 * 3600 * 24)
      return diffInDays >= 30
    })
    : newestPuts

  // Add phantom symbols
  const symbolsToReplace = positionsOlderThan30.map(x => x.symbol)
  return additionalSymbolsToAdd > 0 ?
    [ ...symbolsToReplace, ...Array.apply(null, Array(additionalSymbolsToAdd)).map(() => 'NEWPOSITION') ]
    : symbolsToReplace
}


const _getOrderInstructionsFromSetting = (currentProtectivePuts, protectivePutSetting) => {
  const {
    symbol,
    enabled,
    number,
    frequency,
    targetDelta,
    rollIfNegative,
    minimumTimeToLive,
    minimumAge,
  } = protectivePutSetting

  if (!enabled) {
    return []
  }

  if (number === 0) {
    return []
  }

  // TODO
  const currentPositions = []

  const symbolsToReplace = _determinePutsToReplace(protectivePutSetting, currentPositions)

  if (symbolsToReplace.length === 0) {
    return []
  }

  // Get expirations for symbol
  // Pick first expiration older than minimum age

  // Get the options expiring that day

  // Pick the one closest to targetDelta

  // Loop through symbolsToReplace and add buy orders for any NEWPOSITION

  // Loop through symbolsToReplace, including phantom positions
  // If the new option has a strike higher than open position or rollIfNegative is true, create replacement orders

  // Combine arrays from both loops, and sort so that sells are first

  // Return the replacement orders
}


const rollProtectivePuts = () => {
  // Get settings
  // If protectivePuts is disabled, return and do nothing

  // If market is closed, return and do nothing

  // Get protective put settings from DB
  // If none, return and do nothing

  // Get all current protective puts

  // call getOrderInstructionsFromSetting for each setting

  // Sort so that sell orders are first


}



module.exports = {
  _determinePutsToReplace,
  _getOrderInstructionsFromSetting,
  rollProtectivePuts
}