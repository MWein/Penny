require('dotenv').config()

const { getWatchlistSymbols } = require('./tradier/watchlist')
const { selectBestOption } = require('./tradier/selectBestOption')
const { getPrices } = require('./tradier/getPrices')
const { getOpenOrders } = require('./tradier/getOrders')

const launch = async () => {
  // const watchlist = await getWatchlistSymbols()

  // console.log(watchlist)

  // const bestCall = await selectBestOption('AAPL', 'call')
  // const bestPut = await selectBestOption('AAPL', 'put')
  // console.log(bestCall)
  // console.log(bestPut)

  const orders = await getOpenOrders()
  console.log(orders)

  // const prices = await getPrices([ 'AAPL', 'TSLA' ])
  // console.log(prices)
}

launch()