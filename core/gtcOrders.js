const position = require('../tradier/getPositions')
const order = require('../tradier/getOrders')
const sendOrders = require('../tradier/sendOrders')
const {
  isOption,
} = require('../utils/determineOptionType')


const _getOldOptionsPositions = (positions, orders) => {
  const date = new Date().toISOString().slice(0, 10)
  const applicableOrders = orders.filter(ord => ord.option_symbol && ord.side === 'buy_to_close')

  const oldPositions = positions.filter(pos =>
    !(
      !isOption(pos.symbol) // Is not an option
      || pos.date_acquired.slice(0, 10) === date // Aquired today
      || applicableOrders.find(ord => ord.option_symbol === pos.symbol) // Already has a GTC order
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

  console.log(oldOptionsPositions)

}

module.exports = {
  _getOldOptionsPositions,
  createGTCOrders,
}