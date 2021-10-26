require('dotenv').config()
const CronJob = require('cron').CronJob

//const { getWatchlistSymbols } = require('./tradier/watchlist')
//const { selectBestOption } = require('./tradier/selectBestOption')
//const { getPrices } = require('./tradier/getPrices')
//const { getOrders } = require('./tradier/getOrders')
//const { getPositions } = require('./tradier/getPositions')
//const { sellToOpen } = require('./tradier/sendOrders')
//const { getBalances } = require('./tradier/getBalances')

// Permanent imports
const {
  _determineCoverableTickers,
  sellCoveredCalls
} = require('./core/coveredCall')

const { createGTCOrders } = require('./core/gtcOrders')


const launch = async () => {

  // Manual tests
  //const coverableTickers = await _determineCoverableTickers()
  //console.log(coverableTickers)
  // TODO After 9am local time, this should be empty


  // createGTCOrders()
  // Comment out the part where it actually buys stuff
  // In createGTCOrders function, oldOptionsPositions should be empty after 7am local time





  //await createGTCOrders()

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

  new CronJob('0 0 8 * * 1-5', () => {
    console.log('Creating GTC Orders')
    createGTCOrders()
  }, null, true, 'America/New_York')

  new CronJob('0 0 10 * * 1-5', () => {
    console.log('Selling Covered Calls')
    sellCoveredCalls()
  }, null, true, 'America/New_York')

  new CronJob('0 0 11 * * 1-5', () => {
    console.log('Another for the Mornin: Sell them naked puts, son!')
  }, null, true, 'America/New_York')
  
  new CronJob('0 0 12 * * 1-5', () => {
    console.log('Selling Covered Calls')
    sellCoveredCalls()
  }, null, true, 'America/New_York')

  new CronJob('0 0 13 * * 1-5', () => {
    console.log('Afternoonin: Naked puts')
  }, null, true, 'America/New_York')
}

launch()