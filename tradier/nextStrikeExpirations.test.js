const networkUtil = require('../utils/network')
const logUtil = require('../utils/log')

const {
  nextStrikeExpirations
} = require('./nextStrikeExpirations')


describe('nextStrikeExpirations', () => {
  beforeEach(() => {
    networkUtil.get = jest.fn()
    logUtil.log = jest.fn()
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('Logs and returns empty array if an error occurs', async () => {
    networkUtil.get.mockImplementation(() => {
      throw new Error('Damn')
    })
    const result = await nextStrikeExpirations('AAPL')
    expect(result).toEqual([])
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