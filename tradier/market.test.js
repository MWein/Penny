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
        state: 'postmarket',
      }
    })
    const result = await isMarketOpen()
    expect(result).toEqual(false)
  })

  it('Returns true if response.state is \'open\'', async () => {
    network.get.mockReturnValue({
      clock: {
        state: 'open',
      }
    })
    const result = await isMarketOpen()
    expect(result).toEqual(true)
  })
})