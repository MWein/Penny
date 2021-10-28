require('dotenv').config()
const CronJob = require('cron').CronJob
const mongoose = require('mongoose')

//const { getWatchlistSymbols } = require('./tradier/watchlist')
//const { selectBestOption } = require('./tradier/selectBestOption')
//const { getPrices } = require('./tradier/getPrices')
const ordersUtil = require('./tradier/getOrders')
const { getPositions } = require('./tradier/getPositions')
//const { sellToOpen } = require('./tradier/sendOrders')
//const { getBalances } = require('./tradier/getBalances')
//const { isMarketOpen } = require('./tradier/market')

// Permanent imports
const {
  //_determineCoverableTickers,
  sellCoveredCalls
} = require('./core/coveredCall')

const { sellNakedPuts } = require('./core/nakedPut')

const { createGTCOrders } = require('./core/gtcOrders')



const launchCrons = async () => {
  // sellNakedPuts()
  // return

  // const orders = await ordersUtil.getOrders()
  // const puts = ordersUtil.filterForCashSecuredPutOrders(orders)
  // console.log(puts)

  //createGTCOrders()

  // createGTCOrders()
  // Comment out the part where it actually buys stuff
  // In createGTCOrders function, oldOptionsPositions should be empty after 7am local time
  // TODO Why were these rejected? They werent rejected the second time

  // TODO Check if these positions are different than the comments tomorrow
  // Quantity should be different. So should cost basis
  // Special emphasis on the IDs. Do they change? If not this is some cron job shit
  // Since the goddam history endpoint doesnt work for the sandbox

  // YAY - They do change. However, the GTC orders means it'll be a little hard to track
  // If they were bought back, expired, or were assigned.
  // Probably going to need to use the history endpoint after some real trading occurs


  new CronJob('0 0 10 * * 1-6', () => {
    console.log('Creating GTC Orders')
    createGTCOrders()
  }, null, true, 'America/New_York')

  new CronJob('0 0 11 * * 1-5', () => {
    console.log('Selling Covered Calls')
    sellCoveredCalls()
  }, null, true, 'America/New_York')

  new CronJob('0 0 12 * * 1-5', () => {
    console.log('Selling Naked Puts')
    sellNakedPuts()
  }, null, true, 'America/New_York')
  
  new CronJob('0 0 13 * * 1-5', () => {
    console.log('Selling Covered Calls')
    sellCoveredCalls()
  }, null, true, 'America/New_York')

  new CronJob('0 0 14 * * 1-5', () => {
    console.log('Selling Naked Puts')
    sellNakedPuts()
  }, null, true, 'America/New_York')
}


// Recursively continuously try until the damn thing decides to work
const connectToDB = () => {
  mongoose.connect(process.env.CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
    if (err) {
      console.log('Database Connection Failure - Trying Again')
      connectToDB()
      return
    }
  
    console.log('Database Connection Established')
    launchCrons()
  })
}

connectToDB()