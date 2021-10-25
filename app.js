require('dotenv').config()

const { getWatchlistSymbols } = require('./tradier/watchlist')
const { selectBestOption } = require('./tradier/selectBestOption')
const { getPrices } = require('./tradier/getPrices')
const { getOrders } = require('./tradier/getOrders')
const { getPositions } = require('./tradier/getPositions')
const { sellToOpen } = require('./tradier/sendOrders')
const { getBalances } = require('./tradier/getBalances')

const { _determineCoverableTickers } = require('./core/coveredCall')

const launch = async () => {
  const coverableTickers = await _determineCoverableTickers()
  console.log(coverableTickers)
  // Tomorrow it should have TSLA COKE and PINS

  // TODO other test cases
  // 1. Manually sell a covered call against TSLA at market open and run again. Should say COKE PINS
  // 2. Put an order in after market close for COKE. Should only say PINS

  const positions = await getPositions()
  console.log(positions)
  // Tomorrow it should have TSLA COKE and PINS

  const balances = await getBalances()
  console.log(balances)

  const watchlist = await getWatchlistSymbols()
  console.log(watchlist)
}

launch()