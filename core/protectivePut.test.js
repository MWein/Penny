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

  })

  it('Returns phantom positions up to setting.number if there are no current positions, weekly freq', () => {

  })

  it('Returns phantom positions up to setting.number if there are no current positions, monthly freq', () => {
        
  })

  it('Returns phantom positions and real positions up to setting.number if there are less current positions, weekly freq', () => {

  })

  it('Returns phantom positions and real positions up to setting.number if there are less current positions, monthly freq', () => {
        
  })

  it('Returns the newer positions if there are more positions than setting.number, weekly freq', () => {

  })

  it('Returns the newer positions if there are more positions than setting.number, monthly freq', () => {

  })

  it('Returns only positions that are more than 30 days old if freq is monthly', () => {

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