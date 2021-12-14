require('dotenv').config()
const CronJob = require('cron').CronJob
const mongoose = require('mongoose')

const { sellCoveredCalls } = require('./core/coveredCall')
const { updateGainLossCollection } = require('./utils/updateGainLoss')
const { sellNakedPuts } = require('./core/nakedPut')
const { createGTCOrders } = require('./core/gtcOrders')
const { log, clearOldLogs } = require('./utils/log')
const { savePositionsCron } = require('./utils/savePositionsCron')
const { updateWatchlist } = require('./utils/updateWatchlist')


const housekeeping = async () => {
  log('Clearing Old Logs')
  await clearOldLogs()
  log('Updating Gain Loss Collection')
  await updateGainLossCollection()
  log('Updating Positions Table')
  await savePositionsCron()
}


const sellOptions = async () => {
  log('Selling Covered Calls')
  await sellCoveredCalls()
  log('Selling Naked Puts')
  await sellNakedPuts()
}


const launchCrons = async () => {
  log('Starting Crons')

  new CronJob('0 0 * * * *', () => {
    log({
      type: 'ping',
      message: 'Checking In'
    })
  }, null, true, 'America/New_York')

  new CronJob('0 31 09 * * 1-6', () => {
    log('Creating GTC Orders')
    createGTCOrders()
  }, null, true, 'America/New_York')


  new CronJob('0 0 10 * * 1-5', sellOptions, null, true, 'America/New_York')
  new CronJob('0 0 12 * * 1-5', sellOptions, null, true, 'America/New_York')
  new CronJob('0 0 14 * * 1-5', sellOptions, null, true, 'America/New_York')


  // Run every day at 4:10 NY time
  // 10 mins after market close
  new CronJob('0 10 16 * * *', () => {
    housekeeping()
  }, null, true, 'America/New_York')


  // Run every night at 10pm NY time in nonprod for testing
  // Every Sunday 8pm NY time in prod
  const updateWatchlistCron = () => {
    log('Updating Watchlist')
    updateWatchlist()
  }
  if (process.env.BASEPATH.includes('sandbox')) {
    new CronJob('0 30 21 * * 1-5', updateWatchlistCron, null, true, 'America/New_York')
  } else {
    new CronJob('0 0 20 * * 0', updateWatchlistCron, null, true, 'America/New_York')
  }
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