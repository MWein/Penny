const network = require('../utils/network')
const { getBalances } = require('./getBalances')

describe('getBalances', () => {
  it('Returns balances in the right format', async () => {
    network.get = jest.fn().mockReturnValue({
      balances: {
        total_equity: 1000,
        total_cash: 100000,
        margin: {
          option_buying_power: 700
        }
      }
    })
    const balances = await getBalances()
    expect(balances).toEqual({
      equity: 1000,
      totalCash: 100000,
      optionBuyingPower: 700
    })
  })
})