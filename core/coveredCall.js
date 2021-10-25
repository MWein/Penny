const position = require('../tradier/getPositions')
const order = require('../tradier/getOrders')
const {
  determineOptionTypeFromSymbol,
  isOption,
  getUnderlying,
} = require('../utils/determineOptionType')


const _generatePermittedPositionsMap = (optionableStocks, currentOptions, pendingOptions) => {
  if (optionableStocks.length === 0) {
    return {}
  }

  const startingMap = optionableStocks.reduce((acc, stock) => ({
    ...acc,
    [stock.symbol]: Math.floor(stock.quantity / 100)
  }), {})

  currentOptions.map(opt => {
    const underlying = getUnderlying(opt.symbol)
    const quantity = Math.abs(opt.quantity) // Short options are negative
    startingMap[underlying] = startingMap[underlying] - quantity
  })

  pendingOptions.map(opt => {
    const underlying = opt.symbol
    const quantity = Math.abs(opt.quantity) // Short options are negative
    startingMap[underlying] = startingMap[underlying] - quantity
  })

  return startingMap
}


const sellCoveredCalls = async () => {
  const positions = await position.getPositions()
  const optionableStocks = positions.filter(pos => pos.quantity >= 100 || !isOption(pos.symbol))
  if (optionablePositions.length === 0) {
    return 'no available positions'
  }
  const currentOptions = positions.filter(pos => isOption(pos.symbol))

  const orders = await order.getOrders()
  const callOrders = orders.filter(ord => ord.class === 'option' && ['pending', 'open'].includes(ord.status))
    .filter(ord => determineOptionTypeFromSymbol(ord.symbol) === 'call')

  


  // get current orders


}

module.exports = {
  _generatePermittedPositionsMap,
  sellCoveredCalls,
}