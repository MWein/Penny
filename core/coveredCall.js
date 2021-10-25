const position = require('../tradier/getPositions')
const order = require('../tradier/getOrders')
const {
  determineOptionTypeFromSymbol,
  isOption,
  getUnderlying,
} = require('../utils/determineOptionType')


// Note: This function assumes that positions were split between stocks and options properly
//       and that put options were filtered out
const _generatePermittedPositionsArray = (optionableStocks, currentOptions, pendingOptions) => {
  if (optionableStocks.length === 0) {
    return []
  }

  // Make the initial map
  const permittedCallsMap = optionableStocks.reduce((acc, stock) => ({
    ...acc,
    [stock.symbol]: Math.floor(stock.quantity / 100)
  }), {})

  // Decrease by 1 for every call option that exists
  currentOptions.map(opt => {
    const underlying = getUnderlying(opt.symbol)
    const quantity = Math.abs(opt.quantity) // Short options are negative
    permittedCallsMap[underlying] = permittedCallsMap[underlying] - quantity
  })

  // Decrease by 1 for every call option order that exists
  pendingOptions.map(opt => {
    const underlying = opt.symbol
    const quantity = Math.abs(opt.quantity) // Short options are negative
    permittedCallsMap[underlying] = permittedCallsMap[underlying] - quantity
  })

  // Format map into an array
  return Object.keys(permittedCallsMap).reduce((acc, key) => {
    const quantity = permittedCallsMap[key]
    return quantity <= 0 ? acc : 
      [
        ...acc,
        {
          symbol: key,
          quantity,
        }
      ]
    }, [])
}


const _determineCoverableTickers = async () => {
  const positions = await position.getPositions()
  const optionableStocks = positions.filter(pos => pos.quantity >= 100 && !isOption(pos.symbol))
  if (optionableStocks.length === 0) {
    return []
  }
  const currentOptions = positions.filter(pos => isOption(pos.symbol))

  const orders = await order.getOrders()
  const callOrders = orders.filter(ord => ord.class === 'option' && ['pending', 'open'].includes(ord.status))
    .filter(ord => determineOptionTypeFromSymbol(ord.option_symbol) === 'call')

  return _generatePermittedPositionsArray(optionableStocks, currentOptions, callOrders)
}


const sellCoveredCalls = async () => {

}

module.exports = {
  _generatePermittedPositionsArray,
  _determineCoverableTickers,
  sellCoveredCalls,
}