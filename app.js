require('dotenv').config()

const { getWatchlistSymbols } = require('./tradier/watchlist')


const launch = async () => {
  const watchlist = await getWatchlistSymbols()

  console.log(watchlist)

}

launch()