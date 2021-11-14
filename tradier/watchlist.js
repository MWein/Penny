const network = require('../utils/network')

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
  try {
    await network.put('watchlists/default', {
      name: 'default',
      symbols: tickers.join(',')
    })
  } catch (e) {
    console.log(e)
  }
}


module.exports = {
  getWatchlistSymbols,
  replaceWatchlist,
}