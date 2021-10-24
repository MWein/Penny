require('dotenv').config()

const { getWatchlistSymbols } = require('./tradier/watchlist')
const { selectBestCall } = require('./tradier/selectBestOption')

const launch = async () => {
  // const watchlist = await getWatchlistSymbols()

  // console.log(watchlist)

  await selectBestCall('PINS')

}

launch()