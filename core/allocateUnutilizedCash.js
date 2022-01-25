// TODO Fix later
/* eslint-disable indent */

const cashSecuredPutUtil = require('./cashSecuredPut')
const settingsUtil = require('../utils/settings')
const logUtil = require('../utils/log')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const purchaseGoalSchema = require('../db_models/purchaseGoalSchema')
const priceUtil = require('../tradier/getPrices')
const costBasisUtil = require('../utils/determineCostBasis')

const {
  getUnderlying,
  getStrike,
} = require('../utils/determineOptionType')

// TODO REQUIREMENT
// Need a function that can specifically return the amount available for purchasing
// That way Penny-Data could use it when this becomes a mono-repo


const _idealPositions = (watchlist, positions, orders, optionsToSell, defaultVolatility) => {
  const optionablePositions = positionUtil.filterForOptionableStockPositions(positions)
  const putPositions = positionUtil.filterForPutPositions(positions)
  const putOrders = orderUtil.filterForCashSecuredPutOrders(orders)

  return watchlist
    .filter(item => item.put.enabled && item.maxPositions > 0)
    .map(item => {
      const symbol = item.symbol
      const maxPositions = item.maxPositions
      const volatility = item.volatility || defaultVolatility

      const numStockOptUnits = Math.floor(optionablePositions.find(x => x.symbol === symbol)?.quantity / 100) || 0
      const numPutPositions = putPositions
        .filter(x => getUnderlying(x.symbol) === symbol && x.quantity < 0)
        .reduce((acc, x) => acc + Math.abs(x.quantity), 0)
      const numPutOrders = putOrders
        .filter(x => getUnderlying(x.symbol) === symbol && x.quantity < 0)
        .reduce((acc, x) => acc + Math.abs(x.quantity), 0)
      const numOptsToSell = optionsToSell
        .filter(x => getUnderlying(x.optionSymbol) === symbol)
        .reduce((acc, x) => acc + x.positions, 0)

      return {
        symbol,
        volatility,
        positions: Math.min(maxPositions, numStockOptUnits + numPutPositions + numPutOrders + numOptsToSell)
      }
    }).filter(x => x.positions > 0)
}


const _getBuffer = async (idealPositions, positions, orders) => {
  if (!idealPositions.length) {
    return 0
  }

  const _getCostBasis = async stockPosition => {
    if (!stockPosition) {
      return 0
    } else if (stockPosition.cost_basis) {
      return stockPosition.cost_basis / stockPosition.quantity
    }
    const costBasis = await costBasisUtil.determineCostBasisPerShare(stockPosition.symbol)
    return costBasis
  }

  const symbols = idealPositions.map(x => x.symbol)
  const prices = await priceUtil.getPrices(symbols)

  const optionablePositions = positionUtil.filterForOptionableStockPositions(positions)
  const putPositions = positionUtil.filterForPutPositions(positions)
  const putOrders = orderUtil.filterForCashSecuredPutOrders(orders)

  let buffer = 0
  for (let x = 0; x < idealPositions.length; x++) {
    const idealPosition = idealPositions[x]

    const currentPrice = prices.find(x => x.symbol === idealPosition.symbol)?.price || 0

    const stockPosition = optionablePositions.find(x => x.symbol === idealPosition.symbol)
    const puts = putPositions
      .filter(x => getUnderlying(x.symbol) === idealPosition.symbol && x.quantity < 0)
    const orders = putOrders
      .filter(x => getUnderlying(x.symbol) === idealPosition.symbol && x.quantity < 0)

    const allPutStrikes = puts.map(pos => getStrike(pos.symbol))
    const allPutOrderStrikes = orders.map(ord => getStrike(ord.option_symbol))

    const longStockCostBasis = await _getCostBasis(stockPosition)

    const highestValue = Math.max(currentPrice, longStockCostBasis, ...allPutStrikes, ...allPutOrderStrikes)
    const newBuffer = highestValue * 100 * idealPosition.positions * idealPosition.volatility

    // Failure condition for at least one stock
    // If the price fails and there isn't any backup, should not continue with purchases
    if (newBuffer === 0) {
      return null
    }

    buffer += newBuffer
  }

  return buffer
}


const allocateUnutilizedCash = async () => {
  try {
    const settings = await settingsUtil.getSettings()
    if (!settings.allocateUnutilizedCash) {
      logUtil.log('Allocate Unutilized Funds Disabled')
      return
    }

    const allPositionGoals = await purchaseGoalSchema.find()
    const positionGoals = allPositionGoals.filter(goal => goal.enabled && goal.fulfilled < goal.goal)
    if (!positionGoals.length) {
      logUtil.log('No position goals to trade on')
      return
    }

    // TODO Check if anything is in the watchlist

    // const positions = await positionUtil.getPositions()
    // const orders = await orderUtil.getOrders()

    // const {
    //     balances,
    //     watchlist,
    //     optionsToSell
    // } = await cashSecuredPutUtil.getPositionsToSell(settings)


    // TODO Build current ideal positions object
    // _idealPositions

    // TODO Get current prices for each position + 10%
    /*
        Get prices for each position right now, add 10-15% (should be a setting).
        Buffer override of some kind should be added to the watchlist schema,
        so a particular symbol with high volatility can be accounted for
        without applying the same standard to less volatile stonks.

        This is to prevent a situation where a symbol increases in value,
        but still allow Penny to have enough free money to continue trading it.
        
        ALSO ALSO add the cost of buying buy_to_close orders for each put currently uncovered by one
        */


    // TODO Calc unutilized cash
    // Current buying power - reserve - buffer - wouldBePurchaseValue

    // TODO Figure out which stocks to load up on
    // Filter out anything thats fulfilled or unaffordable (based on current prices, obviously)
    // Sort by priority first, then percent complete, then lowest share price

    // TODO Determine how many of each can be purchased
    // Stock prices should have a 5% buffer so orders don't get rejected for lack of funds or something

    // Send purchase orders

  } catch (e) {
    logUtil.log({
      type: 'error',
      message: e.toString()
    })
  }
}

module.exports = {
  _idealPositions,
  _getBuffer,
  allocateUnutilizedCash,
}