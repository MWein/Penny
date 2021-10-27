require('dotenv').config()
const CronJob = require('cron').CronJob
const mongoose = require('mongoose')

//const { getWatchlistSymbols } = require('./tradier/watchlist')
//const { selectBestOption } = require('./tradier/selectBestOption')
//const { getPrices } = require('./tradier/getPrices')
const { getOrders } = require('./tradier/getOrders')
const { getPositions } = require('./tradier/getPositions')
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

  // TODO Check if these positions are different than the comments tomorrow
  // Quantity should be different. So should cost basis
  // Special emphasis on the IDs. Do they change? If not this is some cron job shit
  // Since the goddam history endpoint doesnt work for the sandbox
  // const positions = await getPositions()
  // const positionsToCheck = positions.filter(x => [ 276413, 276511, 276414 ].includes(x.id))
  // console.log(positionsToCheck)
  // [
  //   {
  //     cost_basis: -14,
  //     date_acquired: '2021-10-26T14:00:10.473Z',
  //     id: 276413,
  //     quantity: -1,
  //     symbol: 'BB211029C00011500'
  //   },
  //   {
  //     cost_basis: -28,
  //     date_acquired: '2021-10-26T17:06:59.913Z',
  //     id: 276511,
  //     quantity: -1,
  //     symbol: 'BB211105P00010500'
  //   },
  //   {
  //     cost_basis: -9,
  //     date_acquired: '2021-10-26T14:00:17.368Z',
  //     id: 276414,
  //     quantity: -1,
  //     symbol: 'KMI211029C00018000'
  //   }
  // ]



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


mongoose.connect(process.env.CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
  if (err) {
    console.log('Database connection failure', err)
    return
  }

  console.log('Database Connection Established')
  launch()
})