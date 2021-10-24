require('dotenv').config()

const { getWatchlistSymbols } = require('./tradier/watchlist')
const { selectBestOption } = require('./tradier/selectBestOption')

const launch = async () => {
  // const watchlist = await getWatchlistSymbols()

  // console.log(watchlist)

  const bestCall = await selectBestOption('AAPL', 'call')
  const bestPut = await selectBestOption('AAPL', 'put')
  console.log(bestCall)
  console.log(bestPut)
}

launch()