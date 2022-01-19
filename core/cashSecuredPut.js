const settings = require('../utils/settings')
const logUtil = require('../utils/log')
const market = require('../tradier/market')
const watchlistUtil = require('../utils/watchlist')


const _getPutPermittedWatchlistItems = async () => {
  const [
    priorityList,
    watchlist,
  ] = await Promise.all([
    settings.getSetting('priorityList'),
    watchlistUtil.getWatchlist(),
  ])

  return priorityList.map(symbol => {
    const watchlistItem = watchlist.find(x => x.symbol === symbol)
    return !watchlistItem || watchlistItem.maxPositions === 0 || !watchlistItem.put.enabled ?
      null : // Mark null if not found or the rules don't allow such things
      watchlistItem
  }).filter(x => x) // Filter out the nulls
}


const sellCashSecuredPuts = async () => {
  const putsEnabled = await settings.getSetting('putsEnabled')
  if (!putsEnabled) {
    logUtil.log('Puts Disabled')
    return
  }

  const open = await market.isMarketOpen()
  if (!open) {
    logUtil.log('Market Closed')
    return
  }

  const puts = await _getPutPermittedWatchlistItems()

  if (!puts.length) {
    logUtil.log('Priority List or Watchlist is Empty')
    return
  }


  // Get the option buying power


  // Extract the symbols and get the prices


  // Loop through and select the best option for each pursuent to the rules


  // Recursive cycle function?


}


module.exports = {
  _getPutPermittedWatchlistItems,
  sellCashSecuredPuts,
}