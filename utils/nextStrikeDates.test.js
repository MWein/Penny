const nextStrikeDates = require('./nextStrikeDates')

describe('nextStrikeDates', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('Returns the next 4 fridays in YYYY-MM-DD format', () => {
    // 12 Oct 2021 is a tuesday
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    const result = nextStrikeDates()
    expect(result).toEqual([ '2021-10-15', '2021-10-22', '2021-10-29', '2021-11-05' ])
  })

  it('Does not return the current date if its a friday', () => {
    // 1 Oct 2021 is a friday
    jest.useFakeTimers().setSystemTime(new Date('2021-10-01T05:10:00Z').getTime())
    const result = nextStrikeDates()
    expect(result).toEqual([ '2021-10-08', '2021-10-15', '2021-10-22', '2021-10-29' ])
  })

  it('Returns the next 4 fridays if at the end of the year', () => {
    jest.useFakeTimers().setSystemTime(new Date('2020-12-22').getTime())
    const result = nextStrikeDates()
    expect(result).toEqual([ '2020-12-25', '2021-01-01', '2021-01-08', '2021-01-15' ])
  })
})