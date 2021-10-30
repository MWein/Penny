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
const { getGainLoss } = require('./tradier/getGainLoss')

const { updateGainLossCollection } = require('./utils/updateGainLoss')

// Permanent imports
const {
  //_determineCoverableTickers,
  sellCoveredCalls
} = require('./core/coveredCall')

const { sellNakedPuts } = require('./core/nakedPut')

const { createGTCOrders } = require('./core/gtcOrders')
const { log, clearOldLogs } = require('./utils/log')


const housekeeping = async () => {
  log('Clearing Old Logs')
  await clearOldLogs()
  log('Updating Gain Loss Collection')
  await updateGainLossCollection()
}


const launchCrons = async () => {
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

  // Run every day at 4:10 NY time
  new CronJob('0 10 16 * * *', () => {
    housekeeping()
  }, null, true, 'America/New_York')
}


// Recursively continuously try until the damn thing decides to work
const connectToDB = () => {
  console.log('Connecting to Database')

  mongoose.connect(process.env.CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
    if (err) {
      // Not much choice in logging to a database we can't connect to
      console.log('Database Connection Failure - Trying Again')

      connectToDB()
      return
    }

    log({
      message: 'Connection Established'
    })

    launchCrons()
  })
}

connectToDB()