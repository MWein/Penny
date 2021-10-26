const balanceUtil = require('../tradier/getBalances')
//const watchlistUtil = require('../tradier/watchlist')
const priceUtil = require('../tradier/getPrices')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const { getUnderlying } = require('../utils/determineOptionType')


// Returns stocks whose price is under buying power and maximum allocation setting
const _getAffordableStocks = (prices, buyingPower) =>
  prices.filter(stock =>
    stock.price * 100 < process.env.MAXIMUMALLOCATION
    && stock.price * 100 < buyingPower
  )

// Gets the approximate allocation for each stock in the price list based on the current price and number of positions/orders already held
// Sorts lowest to highest
const _getEstimatedAllocation = (prices, putPositions, putOrders) => {
  return prices.map(stock => {
    const numPositions = putPositions.filter(pos => getUnderlying(pos.symbol) === stock.symbol)
      .reduce((acc, x) => acc + Math.abs(x.quantity), 0)
    const numOrders = putOrders.filter(ord => ord.symbol === stock.symbol)
      .reduce((acc, x) => acc + Math.abs(x.quantity), 0)

    const existing = numPositions + numOrders
    const allocation = (stock.price * 100) * existing

    return {
      ...stock,
      allocation,
    }
  })
}


const _sellNakedPutsCycle = async (watchlist=[]) => {
  if (watchlist.length === 0) {
    return 'Nothing in watchlist =('
  }

  const balances = await balanceUtil.getBalances()
  const optionBuyingPower = balances.optionBuyingPower
  if (optionBuyingPower <= 0) {
    return 'No money =('
  }

  const prices = await priceUtil.getPrices(watchlist)
  const affordableStocks = _getAffordableStocks(prices, optionBuyingPower)
  if (affordableStocks.length === 0) {
    return 'Too broke for this =('
  }

  // Get all positions
  const positions = await positionUtil.getPositions()
  const putPositions = positionUtil.filterForPutPositions(positions)

  const orders = await orderUtil.getOrders()
  const putOptionOrders = orderUtil.filterForCashSecuredPutOrders(orders)

  console.log(putPositions)
  console.log(putOptionOrders)

  // Get all positions
  // Get all pending orders

  // Get all positions

}

module.exports = {
  _getAffordableStocks,
  _getEstimatedAllocation,
  _sellNakedPutsCycle,
}