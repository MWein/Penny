const priceUtil = require('../tradier/getPrices')
const bestOption = require('../tradier/selectBestOption')
const watchlistUtil = require('../tradier/watchlist')
const nakedPutHelpers = require('./nakedPutCycle')
const settingsUtil = require('../utils/settings')
const market = require('../tradier/market')
const logUtil = require('../utils/log')
const balanceUtil = require('../tradier/getBalances')

const sellNakedPuts = async () => {
  const settings = await settingsUtil.getSettings()
  if (!settings.putsEnabled) {
    logUtil.log('Puts Disabled')
    return
  }

  const open = await market.isMarketOpen()
  if (!open) {
    logUtil.log('Market Closed')
    return
  }

  const watchlist = await watchlistUtil.getWatchlistSymbols()
  if (watchlist.length === 0) {
    logUtil.log('Watchlist Empty')
    return
  }

  const balances = await balanceUtil.getBalances()
  const optionBuyingPower = balances.optionBuyingPower - settings.reserve
  const prices = await priceUtil.getPrices(watchlist)
  const watchlistBelowMaxAllocation = prices
    .filter(ticker => ticker.price * 100 < settings.maxAllocation && ticker.price * 100 < optionBuyingPower)
    .map(x => x.symbol)

  // for-loop so it doesn't call all at once
  const bestOptions = []
  for (let x = 0; x < watchlistBelowMaxAllocation.length; x++) {
    const symbol = watchlistBelowMaxAllocation[x]
    const best = await bestOption.selectBestOption(symbol, 'put')
    if (best && best.strike * 100 < settings.maxAllocation) {
      //console.log(`Best option for ${symbol}: ${best.symbol}`)
      bestOptions.push(best)
    }
  }
  if (bestOptions.length === 0) {
    logUtil.log('No Put Opportunities')
    return
  }

  // Cycle until cycle function returns something other than 'success'
  const _sellNakedPutsHelper = async () => {
    const result = await nakedPutHelpers.sellNakedPutsCycle(bestOptions, settings)
    if (result === 'success') {
      await _sellNakedPutsHelper()
    }
  }
  await _sellNakedPutsHelper()
  logUtil.log('Done')
}


module.exports = {
  sellNakedPuts,
}