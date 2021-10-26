const balanceUtil = require('../tradier/getBalances')
//const watchlistUtil = require('../tradier/watchlist')
const priceUtil = require('../tradier/getPrices')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const bestOption = require('../tradier/selectBestOption')
const { getUnderlying } = require('../utils/determineOptionType')
const sendOrdersUtil = require('../tradier/sendOrders')


// Returns stocks whose price is under buying power and maximum allocation setting
// Maximum allocation is redundant here since it will do it later, but this potentially save network calls
const _getAffordableStocks = (prices, buyingPower) =>
  prices.filter(stock =>
    stock.price * 100 < process.env.MAXIMUMALLOCATION
    && stock.price * 100 < buyingPower
  )

// Gets the approximate allocation for each stock in the price list based on the current price and number of positions/orders already held
// Sorts lowest to highest
const _getEstimatedAllocation = (prices, putPositions, putOrders) =>
  prices.map(stock => {
    const numPositions = putPositions.filter(pos => getUnderlying(pos.symbol) === stock.symbol)
      .reduce((acc, x) => acc + Math.abs(x.quantity), 0)
    const numOrders = putOrders.filter(ord => ord.symbol === stock.symbol)
      .reduce((acc, x) => acc + Math.abs(x.quantity), 0)

    const existing = numPositions + numOrders
    const allocation = (stock.price * 100) * existing
    const potentialAllocation = allocation + (stock.price * 100)

    return {
      ...stock,
      allocation,
      potentialAllocation,
    }
  }).sort((a, b) => a.potentialAllocation - b.potentialAllocation)


// Returns stock symbols that won't be above the maximum allocation
const _getStocksUnderMaxAllocation = stocks =>
  stocks.filter(stock => stock.potentialAllocation < process.env.MAXIMUMALLOCATION)
    .map(stock => stock.symbol)


// Return a list of best options sorted by highest return for the money
const _getPutOptionPriority = bestOptions =>
  bestOptions.filter(option => option).map(option => ({
    ...option,
    percReturn: option.premium / (option.strike * 100)
  })).sort((a, b) => b.percReturn - a.percReturn)



// Returns a list of the options to sell, cutting off when buying power is exhausted
const _getOptionsToSell = (options, optionBuyingPower) => {
  const permittedOptions = options.reduce((acc, option) => {
    const collateral = option.strike * 100
    const newOptionBuyingPower = acc.optionBuyingPower - collateral
    if (newOptionBuyingPower > 0) {
      return {
        symbols: [
          ...acc.symbols,
          option.symbol,
        ],
        optionBuyingPower: newOptionBuyingPower
      }
    }
    return acc
  }, {
    symbols: [],
    optionBuyingPower,
  })

  return permittedOptions.symbols
}


// One cycle of sellNakedPuts
// Will likely run multiple times
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

  const positions = await positionUtil.getPositions()
  const putPositions = positionUtil.filterForPutPositions(positions)

  const orders = await orderUtil.getOrders()
  const putOptionOrders = orderUtil.filterForCashSecuredPutOrders(orders)

  const estimatedAllocation = _getEstimatedAllocation(affordableStocks, putPositions, putOptionOrders)
  const permittedStocks = _getStocksUnderMaxAllocation(estimatedAllocation)
  if (permittedStocks.length === 0) {
    return 'Looks like everything is maxed out =('
  }

  // Get the best options for everything
  const bestOptions = []
  for (let x = 0; x < permittedStocks.length; x++) {
    const symbol = permittedStocks[x]
    const best = await bestOption.selectBestOption(symbol, 'put')
    bestOptions.push(best)
  }

  const prioritizedOptions = _getPutOptionPriority(bestOptions)
  const tickersToSell = _getOptionsToSell(prioritizedOptions, optionBuyingPower)

  // For-loop so they dont send all at once
  for (let x = 0; x < tickersToSell.length; x++) {
    const optionSymbol = tickersToSell[x]
    const symbol = getUnderlying(optionSymbol)
    await sendOrdersUtil.sellToOpen(symbol, optionSymbol, 1)
  }
}

module.exports = {
  _getAffordableStocks,
  _getEstimatedAllocation,
  _getStocksUnderMaxAllocation,
  _getPutOptionPriority,
  _getOptionsToSell,
  _sellNakedPutsCycle,
}