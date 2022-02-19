const nextStrikeUtil = require('../tradier/nextStrikeExpirations')
const sendOrderUtil = require('../tradier/sendOrders')
const network = require('../utils/network')
const market = require('../tradier/market')
const logUtil = require('../utils/log')
const positionsUtil = require('../tradier/getPositions')
const { isOption, getUnderlying } = require('../utils/determineOptionType')
const uniq = require('lodash/uniq')


const _formatChain = (chain, targetA, targetB) => chain
  .map(option => ({
    symbol: option.symbol,
    type: option.option_type,
    premium: Number((option.bid * 100).toFixed()),
    strike: option.strike,
    delta: Math.abs(option.greeks.delta),
    distanceToDeltaTargetA: Math.abs(targetA - Math.abs(option.greeks.delta)),
    distanceToDeltaTargetB: Math.abs(targetB - Math.abs(option.greeks.delta)),
    expiration: option.expiration_date,
  }))


const _selectOptionClosestToTarget = (chain, key) => chain.length > 0 ? chain.reduce((acc, option) =>
  option[key] < acc[key] ? option : acc, chain[0]
) : null



const sellSpread = async (ticker, type, maxStrikeSpread, chain) => {
  const chainWithType = chain.filter(x => x.type === type)

  const shortOpt = _selectOptionClosestToTarget(chainWithType, 'distanceToDeltaTargetA')

  const initialFilter = type === 'call' ?
    (link) => link.strike > shortOpt.strike
    : (link) => link.strike < shortOpt.strike

  const longOptionChoices = chainWithType.filter(initialFilter)
    .filter(x => Math.abs(x.strike - shortOpt.strike) <= maxStrikeSpread)

  const longOpt =  _selectOptionClosestToTarget(longOptionChoices, 'distanceToDeltaTargetB')

  if (!shortOpt || !longOpt) {
    console.log('No good')
    return
  }

  const legs = [
    {
      symbol: shortOpt.symbol,
      side: 'sell_to_open',
      quantity: 1,
    },
    {
      symbol: longOpt.symbol,
      side: 'buy_to_open',
      quantity: 1,
    },
  ]

  // Uncomment when ready!!
  await sendOrderUtil.multilegOptionOrder(ticker, 'credit', legs)
}





// Just a demonstration function to prove this whole thing works
// It will run 3 or 4 times per day and sell spreads on SPY, IWM, and QQQ
const demo = async () => {
  const shortTarget = 0.10
  const longTarget = 0.01
  const stonks = [ 'SPY', 'IWM', 'QQQ' ]

  for (let x = 0; x < stonks.length; x++) {
    const symbol = stonks[x]
    const expirationDates = await nextStrikeUtil.nextStrikeExpirations(symbol)
    const expiration = expirationDates[0]

    const url = `markets/options/chains?symbol=${symbol}&expiration=${expiration}&greeks=true`

    // If a bad expiration date is chosen, this will throw
    try {
      console.log('Getting chain')
      const response = await network.get(url)
      console.log('Got chain')
      const chain = _formatChain(response.options.option, shortTarget, longTarget)

      await sellSpread(symbol, 'call', 1, chain)
      await sellSpread(symbol, 'put', 1, chain)
    } catch (e) {
      // TODO Log
      logUtil.log('demo: Bad things happened with', stonks[x])
      continue
    }
  }
}


// This functon will run with every random stock I can find
// Only one position per ticker is allowed with this one so it needs to check what is currently up
// This will run for the weekly. The bulk of this strategy should be SPY, IWM, and the Qs
// This is to fill out the rest of the portfolio
const demo2 = async () => {
  const shortTarget = 0.10
  const longTarget = 0.01
  const stonks = [
    'DIA', 'AAPL', 'TSLA', 'MSFT', 'BAC', 'WFC', 'FB', 'PTON', 'AMC', 'F',
    'SNDL', 'AMZN', 'DIS', 'NIO', 'LCID', 'NFLX', 'PFE', 'NVDA', 'AAL', 'SNAP', 'PLUG', 'HOOD',
    'GPRO', 'BABA', 'CCL', 'ACB', 'NOK', 'DAL', 'UAL', 'PLTR', 'GME', 'SBUX', 'AMD',
    'COIN', 'TLRY', 'TWTR', 'RIVN', 'T', 'KO', 'CGC', 'GOOG', 'MRNA', 'SPCE', 'BB', 'PYPL', 'UBER',
    'GM', 'ZNGA', 'NCLH', 'WKHS', 'SQ', 'DKNG', 'ABNB', 'BA', 'WMT',
    'JNJ', 'CHPT', 'LUV', 'MRO', 'ARKK', 'RIOT', 'XOM', 'SOFI', 'WISH', 'SONY',
    'PENN', 'COST', 'ZM', 'JPM',
    'RCL', 'CLOV', 'ET', 'INTC', 'V', 'TSM', 'FUBO', 'MA'
  ]

  const positions = await positionsUtil.getPositions()
  const optionPositions = positions.filter(x => isOption(x.symbol))
  const symbolsWithPositions = uniq(optionPositions.map(x => getUnderlying(x.symbol)))
  const tradeableSymbols = stonks.filter(x => !symbolsWithPositions.includes(x))

  for (let x = 0; x < tradeableSymbols.length; x++) {
    const symbol = tradeableSymbols[x]
    const expirationDates = await nextStrikeUtil.nextStrikeExpirations(symbol)
    const expiration = expirationDates[0]

    const url = `markets/options/chains?symbol=${symbol}&expiration=${expiration}&greeks=true`

    console.log(tradeableSymbols)

    // If a bad expiration date is chosen, this will throw
    try {
      console.log('Getting chain')
      const response = await network.get(url)
      console.log('Got chain')
      const chain = _formatChain(response.options.option, shortTarget, longTarget)

      await sellSpread(symbol, 'call', 1, chain)
      await sellSpread(symbol, 'put', 1, chain)
    } catch (e) {
      // TODO Log
      logUtil.log('demo: Bad things happened with', tradeableSymbols[x])
      continue
    }
  }
}


const sellSpreads = async () => {
  // Check if market is open
  const open = await market.isMarketOpen()
  if (!open) {
    logUtil.log('Market Closed')
    return
  }
  
  await demo()
  await demo2()
}

module.exports = {
  sellSpreads,
}