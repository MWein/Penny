const balanceUtil = require('../tradier/getBalances')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const { getUnderlying, isOption } = require('../utils/determineOptionType')
const sendOrdersUtil = require('../tradier/sendOrders')


const _getAffordableOptions = (bestOptions, buyingPower) =>
  bestOptions.filter(opt =>
    opt.strike * 100 < buyingPower
  )

// Gets the approximate allocation for each stock in the price list based on the current price and number of positions/orders already held
// Sorts lowest to highest
const _getEstimatedAllocation = (bestOptions, relevantPositions, putOrders) =>
  bestOptions.map(opt => {
    const numPositions = relevantPositions.filter(pos => getUnderlying(pos.symbol) === getUnderlying(opt.symbol))
      .reduce((acc, x) => acc + (isOption(x.symbol) ? Math.abs(x.quantity) : Math.floor(x.quantity / 100)), 0)

    const numOrders = putOrders.filter(ord => ord.symbol === getUnderlying(opt.symbol))
      .reduce((acc, x) => acc + Math.abs(x.quantity), 0)

    const existing = numPositions + numOrders
    const allocation = (opt.strike * 100) * existing
    const potentialAllocation = allocation + (opt.strike * 100)

    return {
      ...opt,
      allocation,
      potentialAllocation,
      numPositions: existing,
    }
  }).sort((a, b) => a.potentialAllocation - b.potentialAllocation)


// Returns stock symbols that won't be above the maximum allocation
const _getOptionsUnderMaxAllocation = (options, maxAllocation, maxPositions) =>
  options.filter(option => option.potentialAllocation < maxAllocation)
    .filter(option => option.numPositions < maxPositions)


// Return a list of best options sorted by highest return for the money
const _getPutOptionPriority = bestOptions =>
  bestOptions.filter(option => option).map(option => ({
    ...option,
    percReturn: option.weeklyRate / (option.strike * 100)
  })).sort((a, b) => b.percReturn - a.percReturn)



// Returns a list of the options to sell, cutting off when buying power is exhausted
// Also just returns the first 2 in the list
const _getOptionsToSell = (options, optionBuyingPower) => {
  const permittedOptions = options.reduce((acc, option) => {
    if (acc.symbols.length >= 2) {
      return acc
    }

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
const sellNakedPutsCycle = async (bestOptions, settings) => {
  if (bestOptions.length === 0) {
    return 'No options choices =('
  }

  const balances = await balanceUtil.getBalances()
  const optionBuyingPower = balances.optionBuyingPower - settings.reserve
  if (optionBuyingPower <= 0) { // Probably wont be below zero but ya never know
    return 'No money =('
  }

  const affordableOptions = _getAffordableOptions(bestOptions, optionBuyingPower)
  if (affordableOptions.length === 0) {
    return 'Too broke for this =('
  }

  const positions = await positionUtil.getPositions()
  const stockPositions = positionUtil.filterForOptionableStockPositions(positions)
  const putPositions = positionUtil.filterForPutPositions(positions)
  const relevantPositions = [ ...stockPositions, ...putPositions ]

  const orders = await orderUtil.getOrders()
  const putOptionOrders = orderUtil.filterForCashSecuredPutOrders(orders)

  const estimatedAllocation = _getEstimatedAllocation(affordableOptions, relevantPositions, putOptionOrders)
  const permittedOptions = _getOptionsUnderMaxAllocation(estimatedAllocation, settings.maxAllocation, settings.maxPositions)

  if (permittedOptions.length === 0) {
    return 'Looks like everything is maxed out =('
  }

  const prioritizedOptions = _getPutOptionPriority(permittedOptions)
  const tickersToSell = _getOptionsToSell(prioritizedOptions, optionBuyingPower)

  // For-loop so they dont send all at once
  for (let x = 0; x < tickersToSell.length; x++) {
    const optionSymbol = tickersToSell[x]
    const symbol = getUnderlying(optionSymbol)
    //console.log('Selling', symbol)
    await sendOrdersUtil.sellToOpen(symbol, optionSymbol, 1)
  }

  return 'success'
}


module.exports = {
  _getAffordableOptions,
  _getEstimatedAllocation,
  _getOptionsUnderMaxAllocation,
  _getPutOptionPriority,
  _getOptionsToSell,
  sellNakedPutsCycle,
}