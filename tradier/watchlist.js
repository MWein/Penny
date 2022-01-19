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


module.exports = {
  getWatchlistSymbols,
}