const sendOrderUtil = require('../tradier/sendOrders')
const nextExpUtil = require('../tradier/nextStrikeExpirations')
const selectBest = require('../tradier/selectBestOptionForDay')
const logUtil = require('../utils/log')
const pricesUtil = require('../tradier/getPrices')

const insanityCycle = async ticker => {
  try {
    const exps = await nextExpUtil.nextStrikeExpirations(ticker)
    const expiration = exps[0]

    if (!expiration) {
      logUtil.log('What the fuk no expiration')
      return
    }
  
    const prices = await pricesUtil.getPrices([ ticker ])
    const put = await selectBest.selectBestStrikeForDay(ticker, 'put', expiration, null, 0.3)
    const call = await selectBest.selectBestStrikeForDay(ticker, 'call', expiration, null, 0.3)

    const currentPrice = prices[0].price
    const callStrike = call.strike
    const putStrike = put.strike

    const callDist = Math.abs(callStrike - currentPrice)
    const putDist = Math.abs(putStrike - currentPrice)

    // Pick the side thats closer to the 0.3 delta, more likely to win(?)
    const side = callDist < putDist ? 'call' : 'put'

    const opts = await selectBest.selectDemOptions(ticker, side, expiration, currentPrice)

    const {
      shortOpt,
      longOpt,
    } = opts

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
  } catch (e) {
    logUtil.log({
      type: 'error',
      message: `Insanity failed on ${ticker}`
    })
  }
}


const insaneEnoughToWork = async () => {
  try {
    // If market is closed, exit

    const stonks = [
      'SPY', 'IWM', 'DIA', 'AAPL', 'TSLA', 'MSFT', 'BAC', 'WFC', 'FB', 'PTON', 'AMC', 'F',
      'SNDL', 'AMZN', 'DIS', 'NIO', 'LCID', 'NFLX', 'PFE', 'NVDA', 'AAL', 'SNAP', 'PLUG', 'HOOD',
      'GPRO', 'BABA', 'CCL', 'ACB', 'NOK', 'DAL', 'UAL', 'PLTR', 'GME', 'SBUX', 'AMD',
      'COIN', 'TLRY', 'TWTR', 'RIVN', 'T', 'KO', 'CGC', 'GOOG', 'MRNA', 'SPCE', 'BB', 'PYPL', 'UBER',
      'GM', 'ZNGA', 'NCLH', 'WKHS', 'SQ', 'DKNG', 'ABNB', 'BA', 'WMT',
      'JNJ', 'CHPT', 'LUV', 'QQQ', 'MRO', 'ARKK', 'RIOT', 'XOM', 'SOFI', 'WISH', 'SONY',
      'PENN', 'COST', 'ZM', 'BRK.B', 'JPM',
      'RCL', 'CLOV', 'ET', 'INTC', 'V', 'TSM', 'FUBO', 'MA'
    ]

    //console.log(stonks.length)

    for (let x = 0; x < stonks.length; x++) {
      await insanityCycle(stonks[x])
    }

    logUtil.log('Finished the insanity')
  } catch (e) {
    logUtil.log({
      type: 'error',
      message: e.toString()
    })
  }
}

module.exports = {
  insaneEnoughToWork
}