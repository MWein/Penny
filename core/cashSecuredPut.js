const settings = require('../utils/settings')
const logUtil = require('../utils/log')
const market = require('../tradier/market')
const watchlistUtil = require('../utils/watchlist')
const priceUtil = require('../tradier/getPrices')
const balanceUtil = require('../tradier/getBalances')


const _getWatchlistPriorityUnion = async () => {
  const [
    priorityList,
    watchlist,
  ] = await Promise.all([
    settings.getSetting('priorityList'),
    watchlistUtil.getWatchlist(),
  ])
  return priorityList.map(symbol => {
    const watchlistItem = watchlist.find(x => x.symbol === symbol)
    return !watchlistItem ?
      null : // Mark null if not found or the rules don't allow such things
      watchlistItem
  }).filter(x => x) // Filter out the nulls
}


const _preStartFilterWatchlistItems = async (watchlistItems, buyingPower) => {
  const firstPass = watchlistItems.filter(x => x.put.enabled && x.maxPositions > 0)
  if (firstPass.length === 0) {
    return []
  }
  const prices = await priceUtil.getPrices(firstPass.map(x => x.symbol))
  return firstPass.filter(watchlistItem => {
    const price = prices.find(x => x.symbol === watchlistItem.symbol)?.price
    return price ? buyingPower > price * 100 : true // If price is not returned, just pass the filter anyway
  })
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

  const puts = await _getWatchlistPriorityUnion()

  if (!puts.length) {
    logUtil.log('Priority List or Watchlist is Empty')
    return
  }

  // Get balance. Calc balance - reserve

  // Pre filter


  // Loop through and select the best option for each pursuent to the rules


  // Figure out the allocation that can be made. Return an array.


  // Loop through that array and make the orders

}


module.exports = {
  _getWatchlistPriorityUnion,
  _preStartFilterWatchlistItems,
  sellCashSecuredPuts,
}