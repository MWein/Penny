const positionsUtil = require('../tradier/getPositions')
const pricesUtil = require('../tradier/getPrices')
const ordersUtil = require('../tradier/getOrders')
const sendOrdersUtil = require('../tradier/sendOrders')
const {
  getUnderlying,
  getExpiration,
} = require('../utils/determineOptionType')
const logUtil = require('../utils/log')
const settings = require('../utils/settings')


const _getPutsExpiringToday = async () => {
  const positions = await positionsUtil.getPositions()
  const putPositions = positionsUtil.filterForPutPositions(positions)

  if (putPositions.length === 0) {
    return []
  }

  const putPositionsWithExpirations = putPositions.map(pos => {
    const expiration = getExpiration(pos.symbol)
    return {
      ...pos,
      expiration,
    }
  })

  const today = new Date().toISOString().split('T')[0]
  const putsExpiringToday = putPositionsWithExpirations.filter(put => put.expiration === today)

  if (putsExpiringToday.length === 0) {
    return []
  }

  const expiringSymbols = putsExpiringToday.map(x => x.symbol)
  const prices = await pricesUtil.getPrices(expiringSymbols)

  const positionsExpiringTodayWithPrices = putsExpiringToday.map(pos => {
    const price = prices.find(quote => quote.symbol === pos.symbol)?.price || 'none'
    return {
      ...pos,
      price
    }
  }).filter(x => x.price !== 'none')

  return positionsExpiringTodayWithPrices
}


const _filterForPutsAtProfit = puts =>
  puts.filter(put =>
    Math.abs(put.cost_basis) / Math.abs(put.quantity) > put.price * 100)


const _closeExistingBTCOrders = async symbols => {
  const orders = await ordersUtil.getOrders()
  const applicableOrders = orders.filter(x => x.side === 'buy_to_close' && symbols.includes(x.option_symbol))
  const doomedIds = applicableOrders.map(x => x.id)
  await sendOrdersUtil.cancelOrders(doomedIds)
}



const closeExpiringPuts = async () => {
  const closeExpiringPutsEnabled = await settings.getSetting('closeExpiringPuts')
  if (!closeExpiringPutsEnabled) {
    logUtil.log('Close Expiring Puts Disabled')
    return
  }

  logUtil.log('Closing profitable puts expiring today')
  const putsExpiringToday = await _getPutsExpiringToday()
  const profitablePuts = _filterForPutsAtProfit(putsExpiringToday)

  if (profitablePuts.length === 0) {
    logUtil.log('No profitable puts expiring today')
    return
  }

  const profitableSymbols = profitablePuts.map(x => x.symbol)

  logUtil.log('Cancelling current BTC orders')
  await _closeExistingBTCOrders(profitableSymbols)

  for (let x = 0; x < profitablePuts.length; x++) {
    const putToClose = profitablePuts[x]
    const symbol = getUnderlying(putToClose.symbol)
    await sendOrdersUtil.buyToCloseMarket(symbol, putToClose.symbol, Math.abs(putToClose.quantity))
  }
}


module.exports = {
  _getPutsExpiringToday,
  _filterForPutsAtProfit,
  _closeExistingBTCOrders,
  closeExpiringPuts
}