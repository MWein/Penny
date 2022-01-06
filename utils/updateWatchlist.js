const getPricesUtil = require('../tradier/getPrices')
const scraperUtil = require('./scrapeTickers')
const settingsUtil = require('./settings')
const watchlistUtil = require('../tradier/watchlist')
const logUtil = require('./log')
const uniq = require('lodash/uniq')


const updateWatchlist = async () => {
  try {
    const tickers = await scraperUtil.scrapeTickers()

    if (tickers.length === 0) {
      logUtil.log({
        type: 'error',
        message: 'Ticker scraper may have failed'
      })
    }

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
  } catch (e) {
    logUtil.log({
      type: 'error',
      message: 'updateWatchlist function error'
    })
  }
}


module.exports = {
  updateWatchlist
}