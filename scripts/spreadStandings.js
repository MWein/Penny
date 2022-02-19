require('dotenv').config({ path: '../.env' })

const positionsUtil = require('../tradier/getPositions')
const pricesUtil = require('../tradier/getPrices')
const {
  isOption,
  determineOptionTypeFromSymbol,
  getUnderlying,
  getStrike,
} = require('../utils/determineOptionType')
const uniq = require('lodash/uniq')


// If quantity (math.abs) is 2, there should be 2 of the same symbol
const optionSymbolsSpreadOut = options =>
  options.reduce((acc, opt) => [
    ...acc,
    ...Array(Math.abs(opt.quantity)).fill(opt.symbol)
  ], [])


const getSymbolsOfType = (options, type, longOrShort) => {
  const quantityFunc = longOrShort === 'long' ? opt => opt.quantity > 0 : opt => opt.quantity < 0
  return optionSymbolsSpreadOut(
    options.filter(x => quantityFunc(x) && determineOptionTypeFromSymbol(x.symbol) === type)
  )
}


const groupIntoSpreads = (longOpts, shortOpts, type) => {
  const longFilterFunc = type === 'call' ?
    (shortOpt, opt) => getStrike(opt) > getStrike(shortOpt)
    : (shortOpt, opt) => getStrike(opt) < getStrike(shortOpt)

  const longSortFunc = type === 'call' ?
    (a, b) => getStrike(a) - getStrike(b)
    : (a, b) => getStrike(b) - getStrike(a)

  return shortOpts.reduce((acc, shortOpt) => {
    const underlying = getUnderlying(shortOpt)
    const longsWithCompatibleStrike =
      acc.longOptsLeft.filter(x => getUnderlying(x) === underlying && longFilterFunc(shortOpt, x))
        .sort(longSortFunc)

    if (longsWithCompatibleStrike.length === 0) {
      return {
        ...acc,
        lonelyShorts: [ ...acc.lonelyShorts, shortOpt ]
      }
    }

    const longOpt = longsWithCompatibleStrike[0]
    const newSpreads = [ ...acc.spreads, [ shortOpt, longOpt ] ]

    // Splice isn't working right for some reason
    // Modified filter, only removes first occurence of longOpt in case there are multiple
    const { newLongOptsLeft } = acc.longOptsLeft.reduce((acc, x) => {
      return !acc.removed && x === longOpt ?
        { ...acc, removed: true }
        : { ...acc, newLongOptsLeft: [ ...acc.newLongOptsLeft, x ] }
    }, {
      newLongOptsLeft: [],
      removed: false
    })


    return {
      ...acc,
      spreads: newSpreads,
      longOptsLeft: newLongOptsLeft,
    }
  }, {
    spreads: [],
    longOptsLeft: longOpts,
    lonelyShorts: []
  })
}


const getSpreadStanding = (spread, prices) => {
  const type = determineOptionTypeFromSymbol(spread[0])
  const symbol = getUnderlying(spread[0])

  const currentPrice = prices.find(x => x.symbol === symbol)?.price
  if (!currentPrice) {
    return null
  }

  const targetPriceSortFunc = type === 'call' ? (a, b) => a - b : (a, b) => b - a
  const targetPrice = spread.map(x => getStrike(x)).sort(targetPriceSortFunc)[0]
  const winning = type === 'call' ? currentPrice < targetPrice : currentPrice > targetPrice

  return {
    symbol,
    type,
    spread,
    currentPrice,
    targetPrice,
    winning,
  }
}


const spreadStandings = async () => {
  const positions = await positionsUtil.getPositions()
  const options = positions.filter(x => isOption(x.symbol))

  const shortPuts = getSymbolsOfType(options, 'put', 'short')
  const longPuts = getSymbolsOfType(options, 'put', 'long')

  const shortCalls = getSymbolsOfType(options, 'call', 'short')
  const longCalls = getSymbolsOfType(options, 'call', 'long')

  const putSpreadResults = groupIntoSpreads(longPuts, shortPuts, 'put')
  const callSpreadResults = groupIntoSpreads(longCalls, shortCalls, 'call')

  const putSpreads = putSpreadResults.spreads
  const callSpreads = callSpreadResults.spreads


  const allTickers = uniq([ ...putSpreads, ...callSpreads ].map(x => getUnderlying(x[0])))
  const currentPrices = await pricesUtil.getPrices(allTickers)

  const standings = [ ...putSpreads, ...callSpreads ].map(x => getSpreadStanding(x, currentPrices))

  const total = standings.length
  const numberWinning = standings.filter(x => x.winning).length
  const numberLosing = standings.filter(x => !x.winning).length

  const putStandings = standings.filter(x => x.type === 'put')
  const numberPutsWinning = putStandings.filter(x => x.winning).length
  const numberPutsLosing = putStandings.filter(x => !x.winning).length

  const callStandings = standings.filter(x => x.type === 'call')
  const numberCallsWinning = callStandings.filter(x => x.winning).length
  const numberCallsLosing = callStandings.filter(x => !x.winning).length

  console.log('\n------ Total ------')
  console.log('Winning', numberWinning, `${((numberWinning / total) * 100).toFixed(2)}%`)
  console.log('Losing', numberLosing, `${((numberLosing / total) * 100).toFixed(2)}%`)
  console.log('-------------------\n')


  console.log('------ Puts ------')
  console.log('Winning', numberPutsWinning, `${((numberPutsWinning / putStandings.length) * 100).toFixed(2)}%`)
  console.log('Losing', numberPutsLosing, `${((numberPutsLosing / putStandings.length) * 100).toFixed(2)}%`)
  console.log('-------------------\n')


  console.log('------ Calls ------')
  console.log('Winning', numberCallsWinning, `${((numberCallsWinning / callStandings.length) * 100).toFixed(2)}%`)
  console.log('Losing', numberCallsLosing, `${((numberCallsLosing / callStandings.length) * 100).toFixed(2)}%`)
  console.log('-------------------\n')

}

spreadStandings()