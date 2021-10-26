require('dotenv').config()
const CronJob = require('cron').CronJob

const { getWatchlistSymbols } = require('./tradier/watchlist')
const { selectBestOption } = require('./tradier/selectBestOption')
//const { getPrices } = require('./tradier/getPrices')
//const { getOrders } = require('./tradier/getOrders')
const { getPositions } = require('./tradier/getPositions')
//const { sellToOpen } = require('./tradier/sendOrders')
const { getBalances } = require('./tradier/getBalances')

const { _determineCoverableTickers, sellCoveredCalls } = require('./core/coveredCall')

const launch = async () => {
  //const coverableTickers = await _determineCoverableTickers()
  //console.log(coverableTickers)
  // Tomorrow it should have TSLA COKE and PINS

  //const best = await selectBestOption('ZNGA', 'call')
  //console.log(best)

  //const result = await sellCoveredCalls()
  //console.log(result)

  // TODO other test cases
  // 1. Manually sell a covered call against TSLA at market open and run again. Should say COKE PINS - DONE
  // 2. Put an order in after market close for COKE. Should only say PINS

  //const positions = await getPositions()
  //console.log(positions)
  // Tomorrow it should have TSLA COKE and PINS

  //const balances = await getBalances()
  //console.log(balances)

  //const watchlist = await getWatchlistSymbols()
  //console.log(watchlist)

  return

  new CronJob('0 0 8 * * 1-5', () => {
    console.log('Some early mornin cronin for the GTC, biotch!')
  }, null, true, 'America/New_York')

  new CronJob('0 0 10 * * 1-5', () => {
    console.log('One for the Mornin: Sell them covered calls, bruh!')
  }, null, true, 'America/New_York')

  new CronJob('0 0 11 * * 1-5', () => {
    console.log('Another for the Mornin: Sell them naked puts, son!')
  }, null, true, 'America/New_York')
  
  new CronJob('0 0 12 * * 1-5', () => {
    console.log('One for the afternooooon: Maybe sell some more covered calls')
  }, null, true, 'America/New_York')

  new CronJob('0 0 13 * * 1-5', () => {
    console.log('Afternoonin: Naked puts')
  }, null, true, 'America/New_York')
}

launch()