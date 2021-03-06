const network = require('../utils/network')
const {
  _formatChain,
  _filterChain,
  _selectOptionClosestToTarget,
  selectBestStrikeForDay,
} = require('./selectBestOptionForDay')


describe('_formatChain', () => {
  describe('Calls', () => {
    it('Takes the response from Tradier and formats it to be easier for me to read when debugging', async () => {
      const chain = [
        {
          symbol: 'AAPL',
          bid: 1.07,
          strike: 1000,
          greeks: {
            delta: 0.4
          },
          expiration_date: 'tomorrow',
          option_type: 'call'
        }
      ]
      const formattedCallChain = _formatChain(chain, 'call', 0.3)
      expect(formattedCallChain).toEqual([
        {
          symbol: 'AAPL',
          premium: 107,
          strike: 1000,
          delta: 0.4,
          distanceToDeltaTarget: 0.10000000000000003,
          expiration: 'tomorrow',
        }
      ])
    })
  
    it('Filters for calls only', async () => {
      const chain = [
        {
          symbol: 'AAPL',
          bid: 1.07,
          strike: 1000,
          greeks: {
            delta: 0.4
          },
          expiration_date: 'tomorrow',
          option_type: 'call'
        },
        {
          symbol: 'TSLA',
          bid: 1.09,
          strike: 80000,
          greeks: {
            delta: 0.1
          },
          expiration_date: 'day after tomorrow',
          option_type: 'put'
        }
      ]
      const formattedCallChain = _formatChain(chain, 'call', 0.3)
      expect(formattedCallChain).toEqual([
        {
          symbol: 'AAPL',
          premium: 107,
          strike: 1000,
          delta: 0.4,
          distanceToDeltaTarget: 0.10000000000000003,
          expiration: 'tomorrow',
        }
      ])
    })
  })

  describe('Puts', () => {
    it('Takes the response from Tradier and formats it to be easier for me to read when debugging', async () => {
      const chain = [
        {
          symbol: 'AAPL',
          bid: 1.07,
          strike: 1000,
          greeks: {
            delta: -0.4
          },
          expiration_date: 'tomorrow',
          option_type: 'put'
        }
      ]
      const formattedCallChain = _formatChain(chain, 'put', 0.3)
      expect(formattedCallChain).toEqual([
        {
          symbol: 'AAPL',
          premium: 107,
          strike: 1000,
          delta: 0.4,
          distanceToDeltaTarget: 0.10000000000000003,
          expiration: 'tomorrow',
        }
      ])
    })
  
    it('Filters for puts only', async () => {
      const chain = [
        {
          symbol: 'AAPL',
          bid: 1.07,
          strike: 1000,
          greeks: {
            delta: 0.4
          },
          expiration_date: 'tomorrow',
          option_type: 'call'
        },
        {
          symbol: 'TSLA',
          bid: 1.09,
          strike: 80000,
          greeks: {
            delta: -0.1
          },
          expiration_date: 'day after tomorrow',
          option_type: 'put'
        }
      ]
      const formattedCallChain = _formatChain(chain, 'put', 0.3)
      expect(formattedCallChain).toEqual([
        {
          symbol: 'TSLA',
          premium: 109,
          strike: 80000,
          delta: 0.1,
          distanceToDeltaTarget: 0.19999999999999998,
          expiration: 'day after tomorrow',
        }
      ])
    })
  })
})


describe('_filterChain', () => {
  it('If minStrike is passed, filters out anything lower than the minimum', () => {
    const chain = [
      {
        symbol: 'AAPL',
        premium: 107,
        strike: 61,
        delta: 0.3,
      },
      {
        symbol: 'AAPL',
        premium: 107,
        strike: 62,
        delta: 0.3,
      },
      {
        symbol: 'AAPL',
        premium: 107,
        strike: 63,
        delta: 0.3,
      },
    ]
    const filteredChain = _filterChain(chain, 63)
    expect(filteredChain).toEqual([
      {
        symbol: 'AAPL',
        premium: 107,
        strike: 63,
        delta: 0.3,
      },
    ])
  })

  it('Filters out high and low deltas', () => {
    const chain = [
      {
        symbol: 'AAPL',
        premium: 107,
        strike: 61,
        delta: 0.01,
      },
      {
        symbol: 'AAPL',
        premium: 107,
        strike: 62,
        delta: 0.3,
      },
      {
        symbol: 'AAPL',
        premium: 107,
        strike: 62,
        delta: 0.5,
      },
      {
        symbol: 'AAPL',
        premium: 107,
        strike: 63,
        delta: 0.51,
      },
    ]
    const filteredChain = _filterChain(chain)
    expect(filteredChain).toEqual([
      {
        symbol: 'AAPL',
        premium: 107,
        strike: 62,
        delta: 0.3,
      },
      {
        symbol: 'AAPL',
        premium: 107,
        strike: 62,
        delta: 0.5,
      },
    ])
  })

  it('Filters out shit premiums', () => {
    const chain = [
      {
        symbol: 'AAPL',
        premium: 2,
        strike: 61,
        delta: 0.3,
      },
      {
        symbol: 'AAPL',
        premium: 20,
        strike: 62,
        delta: 0.3,
      },
      {
        symbol: 'AAPL',
        premium: 19,
        strike: 63,
        delta: 0.3,
      },
    ]
    const filteredChain = _filterChain(chain)
    expect(filteredChain).toEqual([
      {
        symbol: 'AAPL',
        premium: 20,
        strike: 62,
        delta: 0.3,
      },
    ])
  })
})



describe('_selectOptionClosestToTarget', () => {
  it('Returns empty object if given an empty array', () => {
    const bestOption = _selectOptionClosestToTarget([])
    expect(bestOption).toEqual({})
  })

  it('Selects the delta closest the given target', () => {
    const chain = [
      { distanceToDeltaTarget: 0.2 },
      { distanceToDeltaTarget: 0.1 },
      { distanceToDeltaTarget: 0.7 },
      { distanceToDeltaTarget: 0.8 },
    ]
    const bestOption = _selectOptionClosestToTarget(chain)
    expect(bestOption).toEqual({ distanceToDeltaTarget: 0.1 })
  })
})


describe('selectBestStrikeForDay', () => {
  beforeEach(() => {
    network.get = jest.fn()
  })

  it('Returns empty object if the network call fails for some reason', async () => {
    network.get.mockImplentation = () => {
      throw new Error('Damn it')
    }
    const result = await selectBestStrikeForDay('AAPL', 'call', '2021-01-01', 60)
    expect(result).toEqual({})
  })

  it('Makes a call with the correct URL', async () => {
    network.get.mockReturnValue({
      options: {
        option: []
      }
    })
    await selectBestStrikeForDay('AAPL', 'call', '2021-01-01', 60)
    expect(network.get).toHaveBeenCalledWith('markets/options/chains?symbol=AAPL&expiration=2021-01-01&greeks=true')
  })

  it('Returns the best option symbol and premium for the day, without minimum strike', async () => {
    network.get.mockReturnValue({
      options: {
        option: [
          {
            symbol: 'AAPL1',
            bid: 1.07,
            strike: 61,
            greeks: {
              delta: 0.3
            },
            expiration_date: 'tomorrow',
            option_type: 'call'
          },
          {
            symbol: 'AAPL2',
            bid: 1.07,
            strike: 62,
            greeks: {
              delta: 0.31
            },
            expiration_date: 'tomorrow',
            option_type: 'call'
          },
          {
            symbol: 'AAPL3',
            bid: 1.08,
            strike: 63,
            greeks: {
              delta: 0.7
            },
            expiration_date: 'tomorrow',
            option_type: 'call'
          },
        ]
      }
    })
    const result = await selectBestStrikeForDay('AAPL', 'call', '2021-01-01')
    expect(result).toEqual({
      symbol: 'AAPL1',
      strike: 61,
      premium: 107,
      delta: 0.3,
      distanceToDeltaTarget: 0,
      expiration: 'tomorrow'
    })
  })

  it('Returns the best option for the day, with minimum strike', async () => {
    network.get.mockReturnValue({
      options: {
        option: [
          {
            symbol: 'AAPL1',
            bid: 1.07,
            strike: 61,
            greeks: {
              delta: 0.3
            },
            expiration_date: 'tomorrow',
            option_type: 'call'
          },
          {
            symbol: 'AAPL2',
            bid: 1.07,
            strike: 62,
            greeks: {
              delta: 0.31
            },
            expiration_date: 'tomorrow',
            option_type: 'call'
          },
          {
            symbol: 'AAPL3',
            bid: 1.08,
            strike: 63,
            greeks: {
              delta: 0.7
            },
            expiration_date: 'tomorrow',
            option_type: 'call'
          },
        ]
      }
    })
    const result = await selectBestStrikeForDay('AAPL', 'call', '2021-01-01', 62)
    expect(result).toEqual({
      symbol: 'AAPL2',
      strike: 62,
      premium: 107,
      delta: 0.31,
      distanceToDeltaTarget: 0.010000000000000009,
      expiration: 'tomorrow'
    })
  })
})