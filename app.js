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
  //_determineCoverableTickers,
  sellCoveredCalls
} = require('./core/coveredCall')

const { sellNakedPuts } = require('./core/nakedPut')

const { createGTCOrders } = require('./core/gtcOrders')


const launch = async () => {
  //createGTCOrders()
  // Comment out the part where it actually buys stuff
  // In createGTCOrders function, oldOptionsPositions should be empty after 7am local time

  // const coverableTickers = await _determineCoverableTickers()
  // console.log(coverableTickers)


  new CronJob('0 0 8 * * 1-5', () => {
    console.log('Creating GTC Orders')
    createGTCOrders()
  }, null, true, 'America/New_York')

  new CronJob('0 0 10 * * 1-5', () => {
    console.log('Selling Covered Calls')
    sellCoveredCalls()
  }, null, true, 'America/New_York')

  new CronJob('0 0 11 * * 1-5', () => {
    console.log('Selling Naked Puts')
    sellNakedPuts()
  }, null, true, 'America/New_York')
  
  new CronJob('0 0 12 * * 1-5', () => {
    console.log('Selling Covered Calls')
    sellCoveredCalls()
  }, null, true, 'America/New_York')

  new CronJob('0 0 13 * * 1-5', () => {
    console.log('Selling Naked Puts')
    sellNakedPuts()
  }, null, true, 'America/New_York')
}

launch()