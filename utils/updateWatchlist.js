const getPricesUtil = require('../tradier/getPrices')
const scraperUtil = require('./scrapeTickers')
const settingsUtil = require('./settings')
const watchlistUtil = require('../tradier/watchlist')
const uniq = require('lodash/uniq')


const updateWatchlist = async () => {
  const tickers = await scraperUtil.scrapeTickers()
  const customTickers = await settingsUtil.getSetting('customTickers')
  const bannedTickers = await settingsUtil.getSetting('bannedTickers')

  const allTickers = uniq([ ...tickers, ...customTickers ])
    .filter(ticker => !bannedTickers.includes(ticker))

  if (allTickers.length === 0) {
    return
  }

  const [
    maxAllocation,
    prices,
  ] = await Promise.all([
    settingsUtil.getSetting('maxAllocation'),
    getPricesUtil.getPrices(allTickers),
  ])

  const tickersBelowMaxAllocation = prices.filter(ticker => (ticker.price * 100) < maxAllocation)
    .map(ticker => ticker.symbol)

  await watchlistUtil.replaceWatchlist(tickersBelowMaxAllocation)
}


module.exports = {
  updateWatchlist
}