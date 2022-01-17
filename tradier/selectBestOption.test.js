const {
  _selectOptionWithBestWeeklyPerc,
  selectBestOption,
} = require('./selectBestOption')
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
  })

  it('If not given optional inputs, no min and 4 expirations. Passes type; call', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    await selectBestOption('AAPL', 'call')
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledTimes(4)
    expect(selectBest.selectBestStrikeForDay.mock.calls[0][1]).toEqual('call')
    expect(selectBest.selectBestStrikeForDay.mock.calls[0][3]).toEqual(null)
  })

  it('If not given optional inputs, no min and 4 expirations. Passes type; put', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    await selectBestOption('AAPL', 'put')
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledTimes(4)
    expect(selectBest.selectBestStrikeForDay.mock.calls[0][1]).toEqual('put')
    expect(selectBest.selectBestStrikeForDay.mock.calls[0][3]).toEqual(null)
  })

  it('If not given maxWeeksOut, defaults to 4 expirations', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    await selectBestOption('AAPL', 'call', 30)
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledTimes(4)
  })

  it('If given maxWeeksOut, number of calls should match', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    await selectBestOption('AAPL', 'call', 30, 6)
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledTimes(6)
  })

  it('Symbol and minStrike is passed to selectBestStrikeForDay', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    await selectBestOption('AAPL', 'call', 30, 1)
    expect(selectBest.selectBestStrikeForDay.mock.calls[0][0]).toEqual('AAPL')
    // Skipping the date one so I don't have to use fake timers
    expect(selectBest.selectBestStrikeForDay.mock.calls[0][3]).toEqual(30)
  })

  it('Returns null if nothing is returned', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({})
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({})
    const bestOption = await selectBestOption('AAPL', 'call', 30, 2)
    expect(bestOption).toEqual(null)
  })

  it('Returns the option with the highest weekly rate. First one', async () => {
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
    const bestOption = await selectBestOption('AAPL', 'call', 30, 2)
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
    const bestOption = await selectBestOption('AAPL', 'call', 30, 2)
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