// TODO Fix later
/* eslint-disable indent */

const cashSecuredPutUtil = require('./cashSecuredPut')
const settingsUtil = require('../utils/settings')
const logUtil = require('../utils/log')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')

// TODO REQUIREMENT
// Need a function that can specifically return the amount available for purchasing
// That way Penny-Data could use it when this becomes a mono-repo


const _idealPositions = (positions, orders, optionsToSell) => {
    /*
        Should return an array with each position, and how many Penny
        can sell with the current amount of money Penny has right now.

        To calculate, it should take the actual number of positions + orders
        and add the amount of options Penny would sell if cashSecuredPuts was
        run right now.

        [
            {
                symbol: 'AAPL',
                positions: 2,
            },
            {
                symbol: 'SPY',
                positions: 1
            }
        ]
    */
}


const allocateUnutilizedCash = async () => {
    try {
        const settings = await settingsUtil.getSettings()

        if (!settings.allocateUnutilizedCash) {
            logUtil.log('Allocate Unutilized Funds Disabled')
            return
        }

        // TODO Check if position goals are present
        // TODO Check if position goals are all fulfilled

        const positions = await positionUtil.getPositions()
        const orders = await orderUtil.getOrders()

        const {
            balances,
            watchlist,
            optionsToSell
        } = await cashSecuredPutUtil.getPositionsToSell(settings)


        // TODO Build current ideal positions object
        // _idealPositions

        // TODO Get current prices for each position + 10%
        /*
        Get prices for each position right now, add 10-15% (should be a setting).
        Buffer override of some kind should be added to the watchlist schema,
        so a particular symbol with high volatility can be accounted for
        without applying the same standard to less volatile stonks.

        This is to prevent a situation where a symbol increases in value,
        but still allow Penny to have enough free money to continue trading it.
        */

        /*
            A custom buffer setting should also be considered.
            Literally just reserve a specific amount for this function to ignore minus reserve
            PennyData should be able to tell me how many of each stock Penny could trade
            with the given threshold prior to saving it
        */


        // TODO Calc unutilized cash
        // Current buying power - reserve - buffer - wouldBePurchaseValue

        // TODO Figure out which stocks to load up on
        // Filter out anything thats fulfilled or unaffordable (based on current prices, obviously)
        // Sort by priority first, then percent complete, then lowest share price

        // TODO Determine how many of each can be purchased
        // Stock prices should have a 5% buffer so orders don't get rejected for lack of funds or something

        // Send purchase orders

    } catch (e) {
        logUtil.log({
            type: 'error',
            message: e.toString()
          })
    }
}

module.exports = {
  allocateUnutilizedCash,
}