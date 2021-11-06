const position = require('../tradier/getPositions')
const order = require('../tradier/getOrders')
const sendOrders = require('../tradier/sendOrders')
const logUtil = require('../utils/log')
const {
  isOption,
  getUnderlying,
} = require('../utils/determineOptionType')


const _getOldOptionsPositions = (positions, orders) => {
  const date = new Date().toISOString().slice(0, 10)
  const gtcOrders = order.filterForOptionBuyToCloseOrders(orders)

  const nonDTROptionPositions = positions.filter(pos => isOption(pos.symbol) && pos.date_acquired.slice(0, 10) !== date)

  const unBuyToClosedPostions = nonDTROptionPositions.map(pos => {
    const numGtcPositions = gtcOrders.filter(ord => ord.option_symbol === pos.symbol)
      .reduce((acc, ord) => acc + ord.quantity, 0)

    const uncoveredPositions = Math.abs(pos.quantity) - numGtcPositions

    return {
      symbol: pos.symbol,
      quantity: uncoveredPositions
    }
  }).filter(x => x.quantity > 0)

  return unBuyToClosedPostions
}


const createGTCOrders = async () => {
  const allPositions = await position.getPositions()
  if (allPositions.length === 0) {
    logUtil.log('No Positions to Close')
    return
  }
  const allOrders = await order.getOrders()
  const oldOptionsPositions = _getOldOptionsPositions(allPositions, allOrders)

  // For-loop so we don't send every one of them at once, not that there will be that many
  for (let x = 0; x < oldOptionsPositions.length; x++) {
    const oldOption = oldOptionsPositions[x]
    const symbol = getUnderlying(oldOption.symbol)
    await sendOrders.buyToClose(symbol, oldOption.symbol, oldOption.quantity)
  }
}

module.exports = {
  _getOldOptionsPositions,
  createGTCOrders,
}