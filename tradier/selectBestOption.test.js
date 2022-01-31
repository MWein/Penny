const {
  _selectOptionWithBestWeeklyPerc,
  selectBestOption,
} = require('./selectBestOption')

const nextStrikeUtil = require('./nextStrikeExpirations')
const selectBest = require('./selectBestOptionForDay')


describe('_selectOptionWithBestWeeklyPerc', () => {
  it('Returns null if given an empty array', () => {
    const bestOption = _selectOptionWithBestWeeklyPerc([])
    expect(bestOption).toEqual(null)
  })

  it('Selects the options with the highest perc return, but only in the first 2 weeks if its below 3%', () => {
    const chain = [
      { weeksOut: 1, weeklyPercReturn: 1 },
      { weeksOut: 2, weeklyPercReturn: 1.1 },
      { weeksOut: 3, weeklyPercReturn: 2 },
      { weeksOut: 4, weeklyPercReturn: 2.5 },
    ]
    const bestOption = _selectOptionWithBestWeeklyPerc(chain)
    expect(bestOption).toEqual({ weeksOut: 2, weeklyPercReturn: 1.1 })
  })

  it('Selects the options with the highest perc return, after 2 weeks if above 3%', () => {
    const chain = [
      { weeksOut: 1, weeklyPercReturn: 1 },
      { weeksOut: 2, weeklyPercReturn: 1.1 },
      { weeksOut: 3, weeklyPercReturn: 2 },
      { weeksOut: 4, weeklyPercReturn: 3 },
    ]
    const bestOption = _selectOptionWithBestWeeklyPerc(chain)
    expect(bestOption).toEqual({ weeksOut: 4, weeklyPercReturn: 3 })
  })
})


describe('selectBestOption', () => {
  beforeEach(() => {
    selectBest.selectBestStrikeForDay = jest.fn()
    nextStrikeUtil.nextStrikeExpirations = jest.fn()
  })

  it('If not given optional inputs, no min and 2 expirations. Default 0.3 delta target. Passes type; call', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    nextStrikeUtil.nextStrikeExpirations.mockReturnValue([
      '2021-01-01',
      '2021-02-01'
    ])
    await selectBestOption('AAPL', 'call')
    expect(nextStrikeUtil.nextStrikeExpirations).toHaveBeenCalledWith('AAPL')
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledTimes(2)
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledWith('AAPL', 'call', '2021-01-01', null, 0.3)
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledWith('AAPL', 'call', '2021-02-01', null, 0.3)
  })

  it('If not given optional inputs, no min and 2 expirations. Default 0.3 delta target. Passes type; put', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    nextStrikeUtil.nextStrikeExpirations.mockReturnValue([
      '2021-01-01',
      '2021-02-01'
    ])
    await selectBestOption('AAPL', 'put')
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledTimes(2)
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledWith('AAPL', 'put', '2021-01-01', null, 0.3)
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledWith('AAPL', 'put', '2021-02-01', null, 0.3)
  })

  it('Symbol, minStrike, and targetDelta is passed to selectBestStrikeForDay', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    nextStrikeUtil.nextStrikeExpirations.mockReturnValue([
      '2021-01-01',
      '2021-02-01'
    ])
    await selectBestOption('AAPL', 'call', 30, 0.5)
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledWith('AAPL', 'call', '2021-01-01', 30, 0.5)
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledWith('AAPL', 'call', '2021-02-01', 30, 0.5)
  })

  it('Returns null if nothing is returned', async () => {
    nextStrikeUtil.nextStrikeExpirations.mockReturnValue([
      '2021-01-01',
      '2021-02-01'
    ])
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({})
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({})
    const bestOption = await selectBestOption('AAPL', 'call', 30)
    expect(bestOption).toEqual(null)
  })

  it('Returns the option with the highest weekly rate. First one', async () => {
    nextStrikeUtil.nextStrikeExpirations.mockReturnValue([
      '2021-01-01',
      '2021-02-01'
    ])
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({
      symbol: 'AAPL1234',
      strike: 42,
      premium: 85, // Weekly rate = 85, weekly perc = 2%
    })
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({
      symbol: 'AAPL4321',
      strike: 42,
      premium: 85, // Weekly rate = 42.5, weekly perc = 1%
    })
    const bestOption = await selectBestOption('AAPL', 'call', 30, 0.3)
    expect(bestOption).toEqual({
      symbol: 'AAPL1234',
      strike: 42,
      premium: 85,
      weeklyRate: 85,
      weeklyPercReturn: 2.024,
      weeksOut: 1,
    })
  })

  it('Returns the option with the highest weekly rate. Second one', async () => {
    nextStrikeUtil.nextStrikeExpirations.mockReturnValue([
      '2021-01-01',
      '2021-02-01'
    ])
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({
      symbol: 'AAPL1234',
      strike: 42,
      premium: 85, // Weekly rate = 85, weekly perc = 2.023%
    })
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({
      symbol: 'AAPL4321',
      strike: 42,
      premium: 172, // Weekly rate = 86, weekly perc = 2.048%
    })
    const bestOption = await selectBestOption('AAPL', 'call', 30, 0.3)
    expect(bestOption).toEqual({
      symbol: 'AAPL4321',
      strike: 42,
      premium: 172,
      weeklyRate: 86,
      weeklyPercReturn: 2.048,
      weeksOut: 2
    })
  })
})