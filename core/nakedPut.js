const priceUtil = require('../tradier/getPrices')
const bestOption = require('../tradier/selectBestOption')
const watchlistUtil = require('../tradier/watchlist')
const nakedPutHelpers = require('./nakedPutCycle')
const settingsUtil = require('../utils/settings')

// Broke into its own file so I can stub the cycle function
const sellNakedPuts = async () => {
  const settings = await settingsUtil.getSettings()
  if (!settings.putsEnabled) {
    return
  }

  const watchlist = await watchlistUtil.getWatchlistSymbols()
  if (watchlist.length === 0) {
    return
  }

  const prices = await priceUtil.getPrices(watchlist)
  const watchlistBelowMaxAllocation = prices
    .filter(ticker => ticker.price * 100 < process.env.MAXIMUMALLOCATION)
    .map(x => x.symbol)


  // for-loop so it doesn't call all at once
  const bestOptions = []
  for (let x = 0; x < watchlistBelowMaxAllocation.length; x++) {
    const symbol = watchlistBelowMaxAllocation[x]
    const best = await bestOption.selectBestOption(symbol, 'put')
    if (best && best.strike * 100 < process.env.MAXIMUMALLOCATION) {
      //console.log(`Best option for ${symbol}: ${best.symbol}`)
      bestOptions.push(best)
    }
  }
  if (bestOptions.length === 0) {
    return
  }

  // Cycle until cycle function returns something other than 'success'
  const _sellNakedPutsHelper = async () => {
    //console.log('Selling Puts')
    const result = await nakedPutHelpers.sellNakedPutsCycle(bestOptions)
    //console.log(result)
    if (result === 'success') {
      await _sellNakedPutsHelper()
    }
  }
  await _sellNakedPutsHelper()
}


module.exports = {
  sellNakedPuts,
}