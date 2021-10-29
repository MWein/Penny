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
const { log, clearOldLogs } = require('./utils/log')


const launchCrons = async () => {
  clearOldLogs()
  return


  log('Starting Crons')


  new CronJob('0 0 * * * *', () => {
    log({
      type: 'ping',
      message: 'Checking In'
    })
  }, null, true, 'America/New_York')

  new CronJob('0 0 10 * * 1-6', () => {
    log('Creating GTC Orders')
    createGTCOrders()
  }, null, true, 'America/New_York')

  new CronJob('0 0 11 * * 1-5', () => {
    log('Selling Covered Calls')
    sellCoveredCalls()
  }, null, true, 'America/New_York')

  new CronJob('0 0 12 * * 1-5', () => {
    log('Selling Naked Puts')
    sellNakedPuts()
  }, null, true, 'America/New_York')
  
  new CronJob('0 0 13 * * 1-5', () => {
    log('Selling Covered Calls')
    sellCoveredCalls()
  }, null, true, 'America/New_York')

  new CronJob('0 0 14 * * 1-5', () => {
    log('Selling Naked Puts')
    sellNakedPuts()
  }, null, true, 'America/New_York')
}


// Recursively continuously try until the damn thing decides to work
const connectToDB = () => {
  log('Connecting to Database')

  mongoose.connect(process.env.CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
    if (err) {
      console.log('Database Connection Failure - Trying Again')

      log('Database Connection Failure - Trying Again')

      connectToDB()
      return
    }
  
    console.log('Database Connection Established')
    log({
      message: 'Connection Established'
    })

    launchCrons()
  })
}

connectToDB()