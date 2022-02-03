const {
  daysSince,
  daysUntil,
  dateDiff,
} = require('./dateDiff')

describe('dateDiff functions', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('daysSince', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-01').getTime())
    expect(daysSince('2021-09-12')).toEqual(19)
    expect(daysSince('2020-10-01')).toEqual(365)
    expect(daysSince('2021-10-02')).toEqual(-1)
    expect(daysSince('2021-10-30')).toEqual(-29)
  })

  it('daysUntil', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-01').getTime())
    expect(daysUntil('2021-09-12')).toEqual(-19)
    expect(daysUntil('2020-10-01')).toEqual(-365)
    expect(daysUntil('2021-10-02')).toEqual(1)
    expect(daysUntil('2021-10-30')).toEqual(29)
  })

  it('dateDiff', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-01').getTime())
    expect(dateDiff('2021-09-12')).toEqual(19)
    expect(dateDiff('2020-10-01')).toEqual(365)
    expect(dateDiff('2021-10-02')).toEqual(1)
    expect(dateDiff('2021-10-30')).toEqual(29)
  })
})