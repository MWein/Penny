const network = require('../utils/network')
const { isMarketOpen } = require('./market')

describe('isMarketOpen', () => {
  beforeEach(() => {
    network.get = jest.fn()
  })
  
  it('Returns false if error is thrown', async () => {
    network.get.mockImplementation(() => {
      throw new Error('NOOOOOOO')
    })
    const result = await isMarketOpen()
    expect(result).toEqual(false)
  })

  it('Returns false if response.state is not \'open\'', async () => {
    network.get.mockReturnValue({
      clock: {
        date: '2019-05-06',
        description: 'Market is open from 09:30 to 16:00',
        state: 'postmarket',
        timestamp: 1557156988,
        next_change: '16:00',
        next_state: 'pre'
      }
    })
    const result = await isMarketOpen()
    expect(result).toEqual(false)
  })

  it('Returns true if response.state is \'open\'', async () => {
    network.get.mockReturnValue({
      clock: {
        date: '2019-05-06',
        description: 'Market is open from 09:30 to 16:00',
        state: 'open',
        timestamp: 1557156988,
        next_change: '16:00',
        next_state: 'postmarket'
      }
    })
    const result = await isMarketOpen()
    expect(result).toEqual(true)
  })
})