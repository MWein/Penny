const {
  _determinePutsToReplace,
  _getOrderInstructionsFromSetting,
  rollProtectivePuts
} = require('./protectivePut')

const {
  generatePositionObject
} = require('../utils/testHelpers')



describe('_determinePutsToReplace', () => {
  let mockSetting
  beforeEach(() => {
    mockSetting = {
      symbol: 'AAPL',
      number: 2,
      frequency: 'weekly'
    }
  })

  it('Returns full list if number of positions and setting.number matches, daily/weekly freq', () => {
    const mockPositions = [
      generatePositionObject('AAPL', 2, 'put', 100, '2021-01-01', 1234, '2021-01-02', 69)
    ]
    const putsToReplaceWeekly = _determinePutsToReplace(mockSetting, mockPositions)
    mockSetting.frequency = 'daily'
    const putsToReplaceDaily = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplaceWeekly).toEqual([
      'AAPL210102P00069000',
      'AAPL210102P00069000'
    ])
    expect(putsToReplaceDaily).toEqual(putsToReplaceWeekly)
  })

  it('Returns full list if number of positions and setting.number matches, daily/weekly freq; two different puts', () => {
    const mockPositions = [
      generatePositionObject('AAPL', 1, 'put', 100, '2021-01-01', 1234, '2021-01-02', 69),
      generatePositionObject('AAPL', 1, 'put', 100, '2021-01-01', 1234, '2021-01-03', 70)
    ]
    const putsToReplaceWeekly = _determinePutsToReplace(mockSetting, mockPositions)
    mockSetting.frequency = 'daily'
    const putsToReplaceDaily = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplaceWeekly).toEqual([
      'AAPL210102P00069000',
      'AAPL210103P00070000'
    ])
    expect(putsToReplaceDaily).toEqual(putsToReplaceWeekly)
  })

  it('Ignores stocks, calls, short puts, short calls, and any long puts with a different symbol', () => {
    const mockPositions = [
      generatePositionObject('AAPL', 1, 'put', 100, '2021-01-01', 1234, '2021-01-02', 69),
      generatePositionObject('AAPL', 1, 'put', 100, '2021-01-01', 1234, '2021-01-03', 70),
      generatePositionObject('TSLA', 1, 'put', 100, '2021-01-01', 1234, '2021-01-03', 70),
      generatePositionObject('AAPL', 1, 'stock', 100, '2021-01-01'),
      generatePositionObject('AAPL', -1, 'put', 100, '2021-01-01', 1234, '2021-01-03', 70),
      generatePositionObject('AAPL', 1, 'call', 100, '2021-01-01', 1234, '2021-01-03', 70),
      generatePositionObject('AAPL', -1, 'call', 100, '2021-01-01', 1234, '2021-01-03', 70),
    ]
    const putsToReplace = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplace).toEqual([
      'AAPL210102P00069000',
      'AAPL210103P00070000'
    ])
  })

  it('Returns phantom positions up to setting.number if there are no current positions, daily/weekly freq', () => {
    const mockPositions = []
    const putsToReplaceWeekly = _determinePutsToReplace(mockSetting, mockPositions)
    mockSetting.frequency = 'daily'
    const putsToReplaceDaily = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplaceWeekly).toEqual([
      'NEWPOSITION',
      'NEWPOSITION'
    ])
    expect(putsToReplaceDaily).toEqual(putsToReplaceWeekly)
  })

  it('Returns phantom positions up to setting.number if there are no current positions, monthly freq', () => {
    const mockPositions = []
    mockSetting.frequency = 'monthly'
    const putsToReplace = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplace).toEqual([
      'NEWPOSITION',
      'NEWPOSITION'
    ])
  })

  it('Returns phantom positions and real positions up to setting.number if there are less current positions, daily/weekly freq', () => {
    const mockPositions = [
      generatePositionObject('AAPL', 1, 'put', 100, '2021-01-01', 1234, '2021-01-02', 69),
    ]
    const putsToReplaceWeekly = _determinePutsToReplace(mockSetting, mockPositions)
    mockSetting.frequency = 'daily'
    const putsToReplaceDaily = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplaceWeekly).toEqual([
      'AAPL210102P00069000',
      'NEWPOSITION'
    ])
    expect(putsToReplaceDaily).toEqual(putsToReplaceWeekly)
  })

  it('Returns phantom positions and real positions up to setting.number if there are less current positions, monthly freq', () => {
    const mockPositions = [
      generatePositionObject('AAPL', 1, 'put', 100, '2021-01-01', 1234, '2021-01-02', 69),
    ]
    mockSetting.frequency = 'monthly'
    const putsToReplace = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplace).toEqual([
      'AAPL210102P00069000',
      'NEWPOSITION'
    ])
  })

  it('Returns the older positions if there are more positions than setting.number, daily/weekly freq', () => {
    const mockPositions = [
      generatePositionObject('AAPL', 1, 'put', 100, '2021-01-05', 1234, '2021-01-02', 69),
      generatePositionObject('AAPL', 1, 'put', 100, '2022-01-01', 1234, '2021-01-02', 71),
      generatePositionObject('AAPL', 1, 'put', 100, '2021-01-02', 1234, '2021-01-02', 70),
    ]
    const putsToReplaceWeekly = _determinePutsToReplace(mockSetting, mockPositions)
    mockSetting.frequency = 'daily'
    const putsToReplaceDaily = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplaceWeekly).toEqual([
      'AAPL210102P00071000',
      'AAPL210102P00070000'
    ])
    expect(putsToReplaceDaily).toEqual(putsToReplaceWeekly)
  })

  it('Returns the newer positions if there are more positions than setting.number, monthly freq', () => {
    const mockPositions = [
      generatePositionObject('AAPL', 1, 'put', 100, '2021-01-05', 1234, '2021-01-02', 69),
      generatePositionObject('AAPL', 1, 'put', 100, '2022-01-01', 1234, '2021-01-02', 71),
      generatePositionObject('AAPL', 1, 'put', 100, '2021-01-02', 1234, '2021-01-02', 70),
    ]
    mockSetting.frequency = 'monthly'
    const putsToReplace = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplace).toEqual([
      'AAPL210102P00071000',
      'AAPL210102P00070000'
    ])
  })

  it('Returns only positions that are more than 30 days old if freq is monthly', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-01').getTime())
    const mockPositions = [
      generatePositionObject('AAPL', 1, 'put', 100, '2020-10-02', 1234, '2021-01-02', 69),
      generatePositionObject('AAPL', 1, 'put', 100, '2021-09-15', 1234, '2021-01-02', 71),
      generatePositionObject('AAPL', 1, 'put', 100, '2022-12-04', 1234, '2021-01-02', 72),
      generatePositionObject('AAPL', 1, 'put', 100, '2021-09-01', 1234, '2021-01-02', 73),
      generatePositionObject('AAPL', 1, 'put', 100, '2021-10-01', 1234, '2021-01-02', 74),
    ]
    mockSetting.frequency = 'monthly'
    mockSetting.number = 5
    const putsToReplace = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplace).toEqual([
      'AAPL210102P00069000',
      'AAPL210102P00073000',
    ])
    jest.useRealTimers()
  })

  it('Returns only positions that are more than 30 days old if freq is monthly, also returns NEWPOSITIONS if number of positions is less than number', () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-01').getTime())
    const mockPositions = [
      generatePositionObject('AAPL', 1, 'put', 100, '2020-10-02', 1234, '2021-01-02', 69),
      generatePositionObject('AAPL', 1, 'put', 100, '2021-09-15', 1234, '2021-01-02', 71),
      generatePositionObject('AAPL', 1, 'put', 100, '2021-09-01', 1234, '2021-01-02', 73),
    ]
    mockSetting.frequency = 'monthly'
    mockSetting.number = 5
    const putsToReplace = _determinePutsToReplace(mockSetting, mockPositions)
    expect(putsToReplace).toEqual([
      'AAPL210102P00069000',
      'AAPL210102P00073000',
      'NEWPOSITION',
      'NEWPOSITION'
    ])
    jest.useRealTimers()
  })
})



describe('_getOrderInstructionsFromSetting', () => {
  let mockSetting

  beforeEach(() => {
    mockSetting = {
      symbol: 'AAPL',
      enabled: true,
      number: 1,
      frequency: 'weekly',
      targetDelta: 0.3,
      rollIfNegative: false,
      minimumTimeToLive: 45,
      minimumAge: 180,
    }

    // TODO Mock network funcs
  })

  it('Returns empty array if setting.enabled is false', async () => {
    mockSetting.enabled = false
    const orders = await _getOrderInstructionsFromSetting([], mockSetting)
    expect(orders).toEqual([])
    // TODO Expect that none of the network funcs were called
  })

  it('Returns empty array if setting.number is 0', async () => {
    mockSetting.number = 0
    const orders = await _getOrderInstructionsFromSetting([], mockSetting)
    expect(orders).toEqual([])
    // TODO Expect that none of the network funcs were called
  })

  it('Returns empty array if frequency is "weekly" but its not friday', async () => {

  })

  it('Returns empty array if frequency is "monthly" but none are 30 days old', async () => {

  })
})