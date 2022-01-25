const cashSecuredPutUtil = require('./cashSecuredPut')
const settingsUtil = require('../utils/settings')
const logUtil = require('../utils/log')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')
const purchaseGoalSchema = require('../db_models/purchaseGoalSchema')
const priceUtil = require('../tradier/getPrices')
const costBasisUtil = require('../utils/determineCostBasis')
const sendOrderUtil = require('../tradier/sendOrders')
const market = require('../tradier/market')
const uniq = require('lodash/uniq')

const {
  getUnderlying,
  getStrike,
} = require('../utils/determineOptionType')


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


const _determinePositionsToBuy = (unutilizedCash, positionGoals, prices) =>
  positionGoals
    .sort((a, b) => b.priority - a.priority)
    .reduce((acc, goal) => {
      if (acc.stop) {
        return acc
      }

      const sharePrice = prices.find(x => x.symbol === goal.symbol)?.price

      // If the price util for this one failed, stop = true to halt execution
      if (!sharePrice) {
        logUtil.log({
          type: 'error',
          message: 'Price util failed for _determinePositionsToBuy'
        })
        return {
          ...acc,
          stop: true,
        }
      }

      const remainingShares = goal.goal - goal.fulfilled

      const affordableShares = Math.min(Math.floor(acc.cashRemaining / sharePrice), remainingShares)
      const newRemainingShares = Math.max(remainingShares - affordableShares, 0)

      const canContinue = newRemainingShares !== 0
      const newCashRemaining = acc.cashRemaining - (affordableShares * sharePrice)
      const newPositions = affordableShares > 0 ? [
        ...acc.positions,
        {
          _id: goal._id,
          symbol: goal.symbol,
          quantity: affordableShares
        }
      ] : acc.positions

      return {
        stop: canContinue,
        cashRemaining: newCashRemaining,
        positions: newPositions,
      }
    }, {
      stop: false,
      cashRemaining: unutilizedCash,
      positions: []
    }).positions


// Has to be nested loops like this so it waits for a network call before making the next
// Rate limiting and all that
const _buyPositions = async positionsToBuy => {
  const _buyPositionsHelper = async (_id, symbol, quantity, remainingTries) => {
    if (remainingTries <= 0 || quantity <= 0) {
      return
    }

    const orderResp = await sendOrderUtil.buy(symbol, quantity)
    if (orderResp.status !== 'ok') {
      const nextCycle = await _buyPositionsHelper(_id, symbol, quantity, remainingTries - 1)
      return nextCycle
    }
    const orderId = orderResp.id
    let status = 'open'
    let orderRetriesRemaining = 20
    // Non-terminal statuses
    while (['open', 'partially_filled', 'pending'].includes(status) && orderRetriesRemaining > 0) {
      const order = await orderUtil.getOrder(orderId)
      if (!order) {
        orderRetriesRemaining--
        continue
      }
      status = order.status
    }
    if (status === 'filled') {
      return { _id, symbol, quantity }
    } else {
      const nextCycle = await _buyPositionsHelper(_id, symbol, quantity - 1, remainingTries - 1)
      return nextCycle
    }
  }

  const filledOrders = []

  for (let x = 0; x < positionsToBuy.length; x++) {
    const currentPosition = positionsToBuy[x]
    const filledOrder = await _buyPositionsHelper(currentPosition._id, currentPosition.symbol, currentPosition.quantity, 10)
    if (!filledOrder) {
      break
    }
    filledOrders.push(filledOrder)
  }

  return filledOrders
}



const allocateUnutilizedCash = async () => {
  try {
    const settings = await settingsUtil.getSettings()
    if (!settings.allocateUnutilizedCash) {
      logUtil.log('Allocate Unutilized Funds Disabled')
      return
    }

    const open = await market.isMarketOpen()
    if (!open) {
      logUtil.log('Market Closed')
      return
    }

    const allPositionGoals = await purchaseGoalSchema.find()
    const positionGoals = allPositionGoals.filter(goal => goal.enabled && goal.fulfilled < goal.goal)
    if (!positionGoals.length) {
      logUtil.log('No position goals to trade on')
      return
    }

    const positions = await positionUtil.getPositions()
    const orders = await orderUtil.getOrders()

    const {
      balances,
      watchlist,
      optionsToSell,
    } = await cashSecuredPutUtil.getPositionsToSell(settings)

    const idealPositons = _idealPositions(watchlist, positions, orders, optionsToSell, settings.defaultVolatility)
    const buffer = await _getBuffer(idealPositons, positions, orders)
    if (buffer === null) {
      logUtil.log({
        type: 'error',
        message: 'AllocateUnutilized function: Buffer failed for some reason'
      })
      return
    }

    const unutilizedCash = balances.optionBuyingPower - settings.reserve - buffer

    const goalTickers = uniq(positionGoals.map(x => x.symbol))
    const prices = await priceUtil.getPrices(goalTickers)
    const positionsToBuy = _determinePositionsToBuy(unutilizedCash, positionGoals, prices)

    const filledPositions = await _buyPositions(positionsToBuy)

    await Promise.all(filledPositions.map(async pos => {
      await purchaseGoalSchema.findByIdAndUpdate(pos._id, {$inc : { filled: pos.quantity }})
    }))
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
  _determinePositionsToBuy,
  _buyPositions,
  allocateUnutilizedCash,
}