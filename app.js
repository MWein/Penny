require('dotenv').config()

const { getWatchlistSymbols } = require('./tradier/watchlist')
const { selectBestCall } = require('./tradier/selectBestCall')

const launch = async () => {
  // const watchlist = await getWatchlistSymbols()

  // console.log(watchlist)

  const result = await selectBestCall('NOTREAL')
  console.log(result)
}

launch()