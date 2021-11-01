const network = require('../utils/network')
const settings = require('../utils/settings')
const logUtil = require('../utils/log')

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
    logUtil.log(`Sell-to-open ${quantity} ${option_symbol}`)
    return result
  } catch (e) {
    logUtil.log({
      type: 'error',
      message: `Sell-to-open ${quantity} ${option_symbol} Failed`,
    })
    return {
      status: 'not ok'
    }
  }
}

const buyToClose = async (symbol, option_symbol, quantity) => {
  const buyToCloseAmount = await settings.getSetting('buyToCloseAmount')

  const url = `accounts/${process.env.ACCOUNTNUM}/orders`

  const body = {
    account_id: process.env.ACCOUNTNUM,
    class: 'option',
    symbol,
    option_symbol,
    side: 'buy_to_close',
    quantity,
    type: 'limit',
    price: buyToCloseAmount,
    duration: 'gtc',
  }

  try {
    const result = await network.post(url, body, false)
    logUtil.log(`Buy-to-close ${quantity} ${option_symbol}`)
    return result
  } catch (e) {
    logUtil.log({
      type: 'error',
      message: `Buy-to-close ${quantity} ${option_symbol} Failed`,
    })
    return {
      status: 'not ok'
    }
  }
}

module.exports = {
  sellToOpen,
  buyToClose,
}