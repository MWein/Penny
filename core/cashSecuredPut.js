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

  const permittedItems = priorityList.map(symbol => {
    const watchlistItem = watchlist.find(x => x.symbol === symbol)
    return !watchlistItem || watchlistItem.maxPositions === 0 || !watchlistItem.put.enabled ?
      null :
      watchlistItem
  }).filter(x => x)

  return permittedItems
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

}


module.exports = {
  _getPutPermittedWatchlistItems,
  sellCashSecuredPuts,
}