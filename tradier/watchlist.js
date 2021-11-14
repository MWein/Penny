const network = require('../utils/network')
const logUtil = require('../utils/log')


const getWatchlistSymbols = async () => {
  try {
    const response = await network.get('watchlists/default')
    const watchlistItems = response.watchlist.items.item

    // If theres one item in the watchlist, its an object. Why...
    if (Array.isArray(watchlistItems)) {
      return watchlistItems.map(x => x.symbol)
    } else {
      return [ watchlistItems.symbol ]
    }
  } catch (e) {
    return []
  }
}


const replaceWatchlist = async tickers => {
  if (tickers.length === 0) {
    return
  }
  try {
    await network.put('watchlists/default', {
      name: 'default',
      symbols: tickers.join(',')
    })
  } catch (e) {
    logUtil.log({
      type: 'error',
      message: 'Error updating the watchlist'
    })
  }
}


module.exports = {
  getWatchlistSymbols,
  replaceWatchlist,
}