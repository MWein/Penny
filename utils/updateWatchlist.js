const getPricesUtil = require('../tradier/getPrices')
const scraperUtil = require('./scrapeTickers')
const settingsUtil = require('./settings')
const watchlistUtil = require('../tradier/watchlist')


const updateWatchlist = async () => {
  const tickers = await scraperUtil.scrapeTickers()
  if (tickers.length === 0) {
    return
  }

  const [
    maxAllocation,
    prices,
  ] = await Promise.all([
    settingsUtil.getSetting('maxAllocation'),
    getPricesUtil.getPrices(tickers),
  ])

  const tickersBelowMaxAllocation = prices.filter(ticker => (ticker.price * 100) < maxAllocation)
    .map(ticker => ticker.symbol)

  await watchlistUtil.replaceWatchlist(tickersBelowMaxAllocation)
}


module.exports = {
  updateWatchlist
}