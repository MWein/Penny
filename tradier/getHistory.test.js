const networkUtil = require('../utils/network')
const { getTradeHistoryForSymbol } = require('./getHistory')

describe('getHistory', () => {
  beforeEach(() => {
    networkUtil.get = jest.fn()
  })

  it('Calls the correct url and returns the result', async () => {
    networkUtil.get.mockReturnValue({
      history: {
        event: [ 'some', 'history' ]
      }
    })
    const result = await getTradeHistoryForSymbol('SFIX')
    expect(networkUtil.get).toHaveBeenCalledWith('accounts/undefined/history?limit=100000&type=trade&symbol=SFIX')
    expect(result).toEqual([ 'some', 'history' ])
  })
})