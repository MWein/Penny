const networkUtil = require('../utils/network')
const logUtil = require('../utils/log')

const {
  _nextStrikeDates,
  nextStrikeExpirations,
} = require('./nextStrikeExpirations')


describe('_nextStrikeDates', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('Returns the next 4 fridays in YYYY-MM-DD format', () => {
    // 12 Oct 2021 is a tuesday
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    const result = _nextStrikeDates()
    expect(result).toEqual([ '2021-10-15', '2021-10-22', '2021-10-29', '2021-11-05' ])
  })

  it('If maxWeeksOut limit is given, only returns that number of dates; lower than default', () => {
    // 12 Oct 2021 is a tuesday
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    const result = _nextStrikeDates(3)
    expect(result).toEqual([ '2021-10-15', '2021-10-22', '2021-10-29' ])
  })

  it('If maxWeeksOut limit is given, only returns that number of dates; higher than default', () => {
    // 12 Oct 2021 is a tuesday
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    const result = _nextStrikeDates(5)
    expect(result).toEqual([ '2021-10-15', '2021-10-22', '2021-10-29', '2021-11-05', '2021-11-12' ])
  })

  it('Does not return the current date if its a friday', () => {
    // 1 Oct 2021 is a friday
    jest.useFakeTimers().setSystemTime(new Date('2021-10-01T05:10:00Z').getTime())
    const result = _nextStrikeDates()
    expect(result).toEqual([ '2021-10-08', '2021-10-15', '2021-10-22', '2021-10-29' ])
  })

  it('Returns the next 4 fridays if at the end of the year', () => {
    jest.useFakeTimers().setSystemTime(new Date('2020-12-22').getTime())
    const result = _nextStrikeDates()
    expect(result).toEqual([ '2020-12-25', '2021-01-01', '2021-01-08', '2021-01-15' ])
  })

  // For the sake of 100% test coverage
  it('Returns the next 4 fridays if today is a sunday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-24T10:00Z').getTime())
    const result = _nextStrikeDates()
    expect(result).toEqual([ '2021-10-29', '2021-11-05', '2021-11-12', '2021-11-19' ])
  })
  it('Returns the next 4 fridays if today is a monday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-25T10:00Z').getTime())
    const result = _nextStrikeDates()
    expect(result).toEqual([ '2021-10-29', '2021-11-05', '2021-11-12', '2021-11-19' ])
  })
  it('Returns the next 4 fridays if today is a tuesday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-26T10:00Z').getTime())
    const result = _nextStrikeDates()
    expect(result).toEqual([ '2021-10-29', '2021-11-05', '2021-11-12', '2021-11-19' ])
  })
  it('Returns the next 4 fridays if today is a wednesday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-27T10:00Z').getTime())
    const result = _nextStrikeDates()
    expect(result).toEqual([ '2021-10-29', '2021-11-05', '2021-11-12', '2021-11-19' ])
  })
  it('Returns the next 4 fridays if today is a thursday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-28T10:00Z').getTime())
    const result = _nextStrikeDates()
    expect(result).toEqual([ '2021-10-29', '2021-11-05', '2021-11-12', '2021-11-19' ])
  })
  it('Returns the next 4 fridays if today is a friday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-29T10:00Z').getTime())
    const result = _nextStrikeDates()
    expect(result).toEqual([ '2021-11-05', '2021-11-12', '2021-11-19', '2021-11-26' ])
  })
  it('Returns the next 4 fridays if today is a saturday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-30T10:00Z').getTime())
    const result = _nextStrikeDates()
    expect(result).toEqual([ '2021-11-05', '2021-11-12', '2021-11-19', '2021-11-26' ])
  })
})



describe('nextStrikeExpirations', () => {
  beforeEach(() => {
    networkUtil.get = jest.fn()
    logUtil.log = jest.fn()
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('Logs and returns next 2 fridays if an error occurs', async () => {
    networkUtil.get.mockImplementation(() => {
      throw new Error('Damn')
    })
    const result = await nextStrikeExpirations('AAPL')
    expect(result).toEqual([
      '2021-10-15',
      '2021-10-22',
    ])
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Error: Damn'
    })
  })

  it('Logs and returns next fridays up to limit if an error occurs', async () => {
    networkUtil.get.mockImplementation(() => {
      throw new Error('Damn')
    })
    const result = await nextStrikeExpirations('AAPL', 5)
    expect(result).toEqual([
      '2021-10-15',
      '2021-10-22',
      '2021-10-29',
      '2021-11-05',
      '2021-11-12',
    ])
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Error: Damn'
    })
  })

  it('Does not make any calls and returns empty array if limit is 0', async () => {
    const result = await nextStrikeExpirations('AAPL', 0)
    expect(result).toEqual([])
    expect(networkUtil.get).not.toHaveBeenCalled()
  })

  it('Calls with the correct URL', async () => {
    networkUtil.get.mockReturnValue({
      expirations: {
        date: [
          '2021-01-01',
          '2022-01-01'
        ]
      }
    })
    await nextStrikeExpirations('AAPL', 1)
    expect(networkUtil.get).toHaveBeenCalledWith('/v1/markets/options/expirations?symbol=AAPL')
  })

  it('Returns only the next expiration regardless of the limit if given SPY, QQQ, or IWM', async () => {
    networkUtil.get.mockReturnValue({
      expirations: {
        date: [
          '2021-01-01',
          '2022-01-01'
        ]
      }
    })

    const spyResult = await nextStrikeExpirations('SPY', 50)
    expect(spyResult).toEqual([ '2021-01-01' ])

    const iwmResult = await nextStrikeExpirations('IWM', 50)
    expect(iwmResult).toEqual([ '2021-01-01' ])

    const qqqResult = await nextStrikeExpirations('QQQ', 50)
    expect(qqqResult).toEqual([ '2021-01-01' ])
  })

  it('Excludes current date for SPY, QQQ, and IWM', async () => {
    networkUtil.get.mockReturnValue({
      expirations: {
        date: [
          '2021-10-12', // Date mocked above
          '2021-01-01',
          '2022-01-01'
        ]
      }
    })

    const spyResult = await nextStrikeExpirations('SPY', 50)
    expect(spyResult).toEqual([ '2021-01-01' ])

    const iwmResult = await nextStrikeExpirations('IWM', 50)
    expect(iwmResult).toEqual([ '2021-01-01' ])

    const qqqResult = await nextStrikeExpirations('QQQ', 50)
    expect(qqqResult).toEqual([ '2021-01-01' ])
  })

  it('By default, only returns the first 2 expirations', async () => {
    networkUtil.get.mockReturnValue({
      expirations: {
        date: [
          '2021-01-01',
          '2022-01-01',
          '2023-01-01',
          '2024-01-01',
        ]
      }
    })
    const result = await nextStrikeExpirations('AAPL')
    expect(result).toEqual([
      '2021-01-01',
      '2022-01-01',
    ])
  })

  it('Excludes current date', async () => {
    networkUtil.get.mockReturnValue({
      expirations: {
        date: [
          '2021-10-12', // Date mocked above
          '2021-01-01',
          '2022-01-01',
          '2023-01-01',
          '2024-01-01',
        ]
      }
    })
    const result = await nextStrikeExpirations('AAPL')
    expect(result).toEqual([
      '2021-01-01',
      '2022-01-01',
    ])
  })

  it('Returns number of expirations up to the limit', async () => {
    networkUtil.get.mockReturnValue({
      expirations: {
        date: [
          '2021-01-01',
          '2022-01-01',
          '2023-01-01',
          '2024-01-01',
          '2025-01-01',
          '2026-01-01',
        ]
      }
    })
    const result = await nextStrikeExpirations('AAPL', 5)
    expect(result).toEqual([
      '2021-01-01',
      '2022-01-01',
      '2023-01-01',
      '2024-01-01',
      '2025-01-01',
    ])
  })
})