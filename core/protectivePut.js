const positionsUtil = require('../tradier/getPositions')
const {
  getUnderlying
} = require('../utils/determineOptionType')
const {
  generateSymbol
} = require('../utils/testHelpers')

// Daily and weekly frequency stops should be handled in _getOrderInstructionsFromSetting
const _determinePutsToReplace = (setting, currentPositions) => {
  const {
    symbol,
    number,
    frequency,
  } = setting

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
  const newestPuts = spreadOutPuts.sort((a, b) => new Date(a) - new Date(b)).slice(-2)

  // If setting.frequency is monthly, filter out positions less than 30 days old
  const positionsOlderThan30 = frequency === 'monthly' ? newestPuts : newestPuts

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

  // Filter out currentProtectivePuts for those with symbol

  // Check if current date works with frequency
  if (frequency === 'weekly') {
    // Check if its friday
    // If not, return
  }


  // Filter out positions that are less than a month old, if freq is monthly

  // Create phantom positions if 'number' is greater than the number that we currently have
  // NOTE: Do not create phantom position for less-than-month-old puts if frequency is "monthly"

  // Phantom positions will have a strike of 0, so they are guarenteed to be replaced

  // If 'number' is less than the number we currently have, remove the older ones from play



  // Get expirations for symbol
  // Pick first expiration older than minimum age

  // Get the options expiring that day

  // Pick the one closest to targetDelta

  // Loop through each open positions, including phantom positions
  // If the new option has a strike higher than open position or rollIfNegative is true, create replacement orders

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