const network = require('../utils/network')
const nextStrikeDates = require('../utils/nextStrikeDates')


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


const _selectOptionWithBestWeeklyRate = options => options.length > 0 ? options.reduce((acc, option) =>
  option.weeklyRate > acc.weeklyRate ? option : acc,
  options[0]
).symbol : null


const _selectBestStrikeForDay = async (symbol, expiration, minStrike) => {
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


const selectBestCall = async (symbol, minStrike = null, maxWeeksOut = 4) => {
  const expirationDates = nextStrikeDates()

  // Week is used to calculate the weekly rate
  // Premium / week = weekly rate
  let week = 1
  const options = []

  for (let x = 0; x < expirationDates.length; x++) {
    const expiration = expirationDates[x]
    const bestOption = await _selectBestStrikeForDay(symbol, expiration, minStrike)

    // Skip if best option is empty object
    if (bestOption.symbol) {
      const weeklyRate = bestOption.premium / week
      options.push({ ...bestOption, weeklyRate })
    }
    week++
  }

  return _selectOptionWithBestWeeklyRate(options)
}


module.exports = {
  _formatCallChain,
  _filterCallChain,
  _selectOptionClosestTo30,
  _selectOptionWithBestWeeklyRate,
  _selectBestStrikeForDay,
  selectBestCall,
}