const {
  _selectOptionWithBestWeeklyRate,
  selectBestCall,
} = require('./selectBestOption')
const selectBest = require('./selectBestOptionForDay')


describe('_selectOptionWithBestWeeklyRate', () => {
  it('Returns null if given an empty array', () => {
    const bestOption = _selectOptionWithBestWeeklyRate([])
    expect(bestOption).toEqual(null)
  })

  it('Selects the option with the highest weekly rate', () => {
    const chain = [
      { weeklyRate: 75 },
      { weeklyRate: 55 },
      { weeklyRate: 25 },
    ]
    const bestOption = _selectOptionWithBestWeeklyRate(chain)
    expect(bestOption).toEqual()
  })
})


describe('selectBestCall', () => {
  beforeEach(() => {
    selectBest.selectBestStrikeForDay = jest.fn()
  })

  it('If not given optional inputs, no min and 4 expirations', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    await selectBestCall('AAPL')
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledTimes(4)
    expect(selectBest.selectBestStrikeForDay.mock.calls[0][3]).toEqual(null)
  })

  it('If not given maxWeeksOut, defaults to 4 expirations', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    await selectBestCall('AAPL', 30)
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledTimes(4)
  })

  it('If given maxWeeksOut, number of calls should match', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    await selectBestCall('AAPL', 30, 6)
    expect(selectBest.selectBestStrikeForDay).toHaveBeenCalledTimes(6)
  })

  it('Symbol and minStrike is passed to selectBestStrikeForDay', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValue({})
    await selectBestCall('AAPL', 30, 1)
    expect(selectBest.selectBestStrikeForDay.mock.calls[0][0]).toEqual('AAPL')
    // Skipping the date one so I don't have to use fake timers
    expect(selectBest.selectBestStrikeForDay.mock.calls[0][3]).toEqual(30)
  })

  it('Returns null if nothing is returned', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({})
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({})
    const bestOption = await selectBestCall('AAPL', 30, 2)
    expect(bestOption).toEqual(null)
  })

  it('Returns the option with the highest weekly rate. First one', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({
      symbol: 'AAPL1234',
      premium: 85, // Weekly rate = 85
    })
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({
      symbol: 'AAPL4321',
      premium: 85, // Weekly rate = 42.5
    })
    const bestOption = await selectBestCall('AAPL', 30, 2)
    expect(bestOption).toEqual('AAPL1234')
  })

  it('Returns the option with the highest weekly rate. Second one', async () => {
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({
      symbol: 'AAPL1234',
      premium: 85, // Weekly rate = 85
    })
    selectBest.selectBestStrikeForDay.mockReturnValueOnce({
      symbol: 'AAPL4321',
      premium: 172, // Weekly rate = 86
    })
    const bestOption = await selectBestCall('AAPL', 30, 2)
    expect(bestOption).toEqual('AAPL4321')
  })
})