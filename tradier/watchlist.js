const { get } = require('../utils/network')

const getWatchlistSymbols = async () => {
  try {
    const response = await get('watchlists/penny')
    const watchlistItems = response.watchlist.items.item

    // If theres one item in the watchlist, its an object. Why
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
  getWatchlistSymbols
}