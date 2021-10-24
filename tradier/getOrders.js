const network = require('../utils/network')

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
  getOrders
}