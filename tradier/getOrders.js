const network = require('../utils/network')
const {
  isOption,
  determineOptionTypeFromSymbol
} = require('../utils/determineOptionType')

const filterForCoveredCallOrders = orders =>
  orders.filter(ord =>
    ord.class === 'option'
    && [ 'open', 'partially_filled', 'pending', 'calculated', 'accepted_for_bidding', 'held' ].includes(ord.status)
    && ord.side === 'sell_to_open'
    && determineOptionTypeFromSymbol(ord.option_symbol) === 'call'
  )


const filterForCashSecuredPutOrders = orders =>
  orders.filter(ord =>
    ord.class === 'option'
    && [ 'open', 'partially_filled', 'pending', 'calculated', 'accepted_for_bidding', 'held' ].includes(ord.status)
    && ord.side === 'sell_to_open'
    && determineOptionTypeFromSymbol(ord.option_symbol) === 'put'
  )


const filterForOptionBuyToCloseOrders = orders =>
  orders.filter(ord =>
    ord.class === 'option'
    && [ 'open', 'partially_filled', 'pending', 'calculated', 'accepted_for_bidding', 'held' ].includes(ord.status)
    && ord.side === 'buy_to_close'
    && isOption(ord.option_symbol)
  )


const getOrders = async () => {
  const url = `accounts/${process.env.ACCOUNTNUM}/orders`
  const response = await network.get(url)
  if (response.orders === 'null') {
    return []
  }
  if (Array.isArray(response.orders.order)) {
    return response.orders.order
  } else {
    return [ response.orders.order ]
  }
}

module.exports = {
  filterForCoveredCallOrders,
  filterForCashSecuredPutOrders,
  filterForOptionBuyToCloseOrders,
  getOrders,
}