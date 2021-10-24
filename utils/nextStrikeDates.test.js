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

  // For the sake of 100% test coverage
  it('Returns the next 4 fridays if today is a sunday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-24T10:00Z').getTime())
    const result = nextStrikeDates()
    expect(result).toEqual([ '2021-10-29', '2021-11-05', '2021-11-12', '2021-11-19' ])
  })
  it('Returns the next 4 fridays if today is a monday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-25T10:00Z').getTime())
    const result = nextStrikeDates()
    expect(result).toEqual([ '2021-10-29', '2021-11-05', '2021-11-12', '2021-11-19' ])
  })
  it('Returns the next 4 fridays if today is a tuesday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-26T10:00Z').getTime())
    const result = nextStrikeDates()
    expect(result).toEqual([ '2021-10-29', '2021-11-05', '2021-11-12', '2021-11-19' ])
  })
  it('Returns the next 4 fridays if today is a wednesday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-27T10:00Z').getTime())
    const result = nextStrikeDates()
    expect(result).toEqual([ '2021-10-29', '2021-11-05', '2021-11-12', '2021-11-19' ])
  })
  it('Returns the next 4 fridays if today is a thursday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-28T10:00Z').getTime())
    const result = nextStrikeDates()
    expect(result).toEqual([ '2021-10-29', '2021-11-05', '2021-11-12', '2021-11-19' ])
  })
  it('Returns the next 4 fridays if today is a friday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-29T10:00Z').getTime())
    const result = nextStrikeDates()
    expect(result).toEqual([ '2021-11-05', '2021-11-12', '2021-11-19', '2021-11-26' ])
  })
  it('Returns the next 4 fridays if today is a saturday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-30T10:00Z').getTime())
    const result = nextStrikeDates()
    expect(result).toEqual([ '2021-11-05', '2021-11-12', '2021-11-19', '2021-11-26' ])
  })
})