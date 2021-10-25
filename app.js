require('dotenv').config()

const { getWatchlistSymbols } = require('./tradier/watchlist')
const { selectBestOption } = require('./tradier/selectBestOption')
const { getPrices } = require('./tradier/getPrices')
const { getOrders } = require('./tradier/getOrders')
const { getPositions } = require('./tradier/getPositions')
const { sellToOpen } = require('./tradier/sendOrders')

const launch = async () => {
  // const watchlist = await getWatchlistSymbols()

  // console.log(watchlist)

  //const bestCall = await selectBestOption('AAPL', 'call')
  //const bestPut = await selectBestOption('AAPL', 'put')
  //console.log(bestCall)
  //console.log(bestPut)

  //const orders = await getOrders()
  //console.log(orders)

  // const positions = await getPositions()
  // console.log(positions)



  const result = await sellToOpen('AAPL', 'AAPL211029C00152500', 1)
  console.log(result)

  // const prices = await getPrices([ 'AAPL', 'TSLA' ])
  // console.log(prices)
}

launch()