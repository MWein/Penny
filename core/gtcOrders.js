const position = require('../tradier/getPositions')
const order = require('../tradier/getOrders')
const sendOrders = require('../tradier/sendOrders')
const {
  isOption,
  getUnderlying,
} = require('../utils/determineOptionType')


const _getOldOptionsPositions = (positions, orders) => {
  const date = new Date().toISOString().slice(0, 10)
  const gtcOrders = order.filterForOptionBuyToCloseOrders(orders)

  const oldPositions = positions.filter(pos =>
    !(
      !isOption(pos.symbol) // Is not an option
      || pos.date_acquired.slice(0, 10) === date // Aquired today
      || gtcOrders.find(ord => ord.option_symbol === pos.symbol) // Already has a GTC order
    )
  ).map(pos => ({
    symbol: pos.symbol,
    quantity: Math.abs(pos.quantity)
  }))

  return oldPositions
}


const createGTCOrders = async () => {
  const allPositions = await position.getPositions()
  if (allPositions.length === 0) {
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