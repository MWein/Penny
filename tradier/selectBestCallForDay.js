const network = require('../utils/network')


const _formatCallChain = chain => chain
  .filter(option => option.option_type === 'call')
  .map(option => ({
    symbol: option.symbol,
    premium: Number((option.bid * 100).toFixed()),
    strike: option.strike,
    delta: option.greeks.delta,
    distanceTo30: Math.abs(0.3 - option.greeks.delta),
    expiration: option.expiration_date,
  }))


const _filterCallChain = (chain, minStrike) => chain.filter(option => {
  if (minStrike !== null && option.strike < minStrike) {
    // Filter out all below minStrike if minStrike was passed
    return false
  }

  // Filter out anything with a delta higher than .40 or lower than 0.1
  // Filter out anything with a shit premium
  return option.delta < 0.4 && option.delta > 0.1 && option.premium >= 5
})


const _selectOptionClosestTo30 = chain => chain.length > 0 ? chain.reduce((acc, option) =>
  option.distanceTo30 < acc.distanceTo30 ? option : acc,
  chain[0]
) : {}


const selectBestStrikeForDay = async (symbol, expiration, minStrike) => {
  const url = `markets/options/chains?symbol=${symbol}&expiration=${expiration}&greeks=true`

  // If a bad expiration date is chosen, this will throw
  try {
    const response = await network.get(url)
    const callChain = _formatCallChain(response.options.option)
    const filteredCallChain = _filterCallChain(callChain, minStrike)
    const closestTo30Delta = _selectOptionClosestTo30(filteredCallChain)
    return {
      symbol: closestTo30Delta.symbol,
      premium: closestTo30Delta.premium,
    }
  } catch (e) {
    return {}
  }
}


module.exports = {
  _formatCallChain,
  _filterCallChain,
  _selectOptionClosestTo30,
  selectBestStrikeForDay,
}