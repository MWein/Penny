const {
  getPositions,
  filterForPutPositions,
} = require('../tradier/getPositions')
const { getPrices } = require('../tradier/getPrices')
const { getQuotes } = require('../tradier/getQuotes')
const { getOrders } = require('../tradier/getOrders')
const {
  buyToCloseMarket,
  cancelOrders
} = require('../tradier/sendOrders')
const { getUnderlying } = require('../utils/determineOptionType')


const _getPutsExpiringToday = async () => {
  const positions = await getPositions()
  const putPositions = filterForPutPositions(positions)
  const symbols = putPositions.map(x => x.symbol)
  const quotes = await getQuotes(symbols)
  const prices = await getPrices(symbols)

  const putPositionsWithExpirations = putPositions.map(pos => {
    const expiration = quotes.find(quote => quote.symbol === pos.symbol)?.expiration_date || 'none'
    const price = prices.find(quote => quote.symbol === pos.symbol)?.price || -1

    return {
      ...pos,
      expiration,
      price: price
    }
  })

  // TODO filter for puts expiring today
  const putsExpiringToday = putPositionsWithExpirations

  return putsExpiringToday
}


const _filterForPutsAtProfit = puts =>
  puts.filter(put =>
    (put.cost_basis * -1) / (put.quantity * -1) > put.price * 100)


const _closeExistingBTCOrders = async symbols => {
  const orders = await getOrders()
  const applicableOrders = orders.filter(x => x.side === 'buy_to_close' && symbols.includes(x.option_symbol))
  const doomedIds = applicableOrders.map(x => x.id)
  await cancelOrders(doomedIds)
}


const closeExpiringPuts = async () => {
  const putsExpiringToday = await _getPutsExpiringToday()
  const profitablePuts = _filterForPutsAtProfit(putsExpiringToday)

  if (profitablePuts.length === 0) {
    return
  }

  const profitableSymbols = profitablePuts.map(x => x.symbol)
  await _closeExistingBTCOrders(profitableSymbols)

  for (let x = 0; x < profitablePuts.length; x++) {
    const putToClose = profitablePuts[x]
    const symbol = getUnderlying(putToClose.symbol)
    await buyToCloseMarket(symbol, putToClose.symbol, putToClose.quantity * -1)
  }
}


module.exports = {
  _getPutsExpiringToday,
  _filterForPutsAtProfit,
  closeExpiringPuts
}