const {
  _selectOptionWithBestWeeklyRate,
  selectBestCall,
} = require('./selectBestCall')


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


