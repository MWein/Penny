const position = require('../tradier/getPositions')
const order = require('../tradier/getOrders')
const sendOrders = require('../tradier/sendOrders')
const settings = require('../utils/settings')
const logUtil = require('../utils/log')
const market = require('../tradier/market')
const {
  isOption,
  getUnderlying,
} = require('../utils/determineOptionType')


const _getOldOptionsPositions = (positions, orders) => {
  const date = new Date().toISOString().slice(0, 10)
  const gtcOrders = order.filterForOptionBuyToCloseOrders(orders)

  const nonDTROptionPositions = positions.filter(pos => isOption(pos.symbol) && pos.date_acquired.slice(0, 10) !== date && pos.quantity < 0)

  const unBuyToClosedPostions = nonDTROptionPositions.map(pos => {
    const numGtcPositions = gtcOrders.filter(ord => ord.option_symbol === pos.symbol)
      .reduce((acc, ord) => acc + ord.quantity, 0)

    const uncoveredPositions = Math.abs(pos.quantity) - numGtcPositions
    const costBasisPerPosition = Number((Math.abs(pos.cost_basis) / Math.abs(pos.quantity)).toFixed(2))

    return {
      symbol: pos.symbol,
      quantity: uncoveredPositions,
      costBasisPerPosition
    }
  }).filter(x => x.quantity > 0)

  return unBuyToClosedPostions
}


const createGTCOrders = async () => {
  try {
    const open = await market.isMarketOpen()
    if (!open) {
      logUtil.log('Market Closed')
      return
    }
  
    const allPositions = await position.getPositions()
    if (allPositions.length === 0) {
      logUtil.log('No Positions to Close')
      return
    }
    const allOrders = await order.getOrders()
    const oldOptionsPositions = _getOldOptionsPositions(allPositions, allOrders)
  
    const profitTarget = await settings.getSetting('profitTarget')
    const buyToClosePerc = 1 - profitTarget
  
    // For-loop so we don't send every one of them at once, not that there will be that many
    for (let x = 0; x < oldOptionsPositions.length; x++) {
      const oldOption = oldOptionsPositions[x]
      const symbol = getUnderlying(oldOption.symbol)
      const buyToCloseAmount = Number(((oldOption.costBasisPerPosition * buyToClosePerc) / 100).toFixed(2))
      await sendOrders.buyToClose(symbol, oldOption.symbol, oldOption.quantity, buyToCloseAmount)
    }
  } catch (e) {
    logUtil.log({
      type: 'error',
      message: e.toString()
    })
  }
}

module.exports = {
  _getOldOptionsPositions,
  createGTCOrders,
}