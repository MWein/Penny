const network = require('../utils/network')

const sellToOpen = async (symbol, option_symbol, quantity) => {
  const url = `accounts/${process.env.ACCOUNTNUM}/orders`

  const body = {
    account_id: process.env.ACCOUNTNUM,
    class: 'option',
    symbol,
    option_symbol,
    side: 'sell_to_open',
    quantity,
    type: 'market',
    duration: 'day',
  }

  try {
    const result = await network.post(url, body, false)
    return result
  } catch (e) {
    return {
      status: 'not ok'
    }
  }
}

const buyToClose = async (symbol, option_symbol, quantity) => {
  const url = `accounts/${process.env.ACCOUNTNUM}/orders`

  const body = {
    account_id: process.env.ACCOUNTNUM,
    class: 'option',
    symbol,
    option_symbol,
    side: 'buy_to_close',
    quantity,
    type: 'limit',
    price: 1,
    duration: 'gtc',
  }

  try {
    const result = await network.post(url, body, false)
    return result
  } catch (e) {
    return {
      status: 'not ok'
    }
  }
}

module.exports = {
  sellToOpen,
  buyToClose,
}