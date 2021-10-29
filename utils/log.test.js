const logSchema = require('../db_models/logSchema')
jest.mock('../db_models/logSchema')

const {
  _logWithObject,
  _logWithMessage,
  log,
  clearOldLogs
} = require('./log')


describe('_logWithObject', () => {
  const originalConsoleLog = console.log
  let saveFunc

  beforeEach(() => {
    saveFunc = jest.fn()
    logSchema.mockReturnValue({
      save: saveFunc,
    })
    console.log = jest.fn()
  })

  afterEach(() => {
    console.log = originalConsoleLog
  })

  it('On failure, console logs', async () => {
    logSchema.mockImplementation(() => {
      throw new Error('Oh no!!!!!!')
    })
    await _logWithObject({ message: 'something' })
    expect(logSchema).toHaveBeenCalledWith({ message: 'something' })
    expect(console.log).toHaveBeenCalledWith('Error reaching database')
  })

  it('On success, saves and console logs the message', async () => {
    await _logWithObject({ type: 'error', message: 'something' })
    expect(saveFunc).toHaveBeenCalledTimes(1)
    expect(logSchema).toHaveBeenCalledWith({ type: 'error', message: 'something' })
    expect(console.log).toHaveBeenCalledWith('error', ':', 'something')
  })

  it('Does not console log if type is \'ping\'', async () => {
    await _logWithObject({ type: 'ping', message: 'something' })
    expect(saveFunc).toHaveBeenCalledTimes(1)
    expect(logSchema).toHaveBeenCalledWith({ type: 'ping', message: 'something' })
    expect(console.log).not.toHaveBeenCalled()
  })

  it('Console log says \'info\' if type is not provided', async () => {
    await _logWithObject({ message: 'something' })
    expect(saveFunc).toHaveBeenCalledTimes(1)
    expect(logSchema).toHaveBeenCalledWith({ message: 'something' })
    expect(console.log).toHaveBeenCalledWith('info', ':', 'something')
  })
})


describe('_logWithMessage', () => {
  const originalConsoleLog = console.log
  let saveFunc

  beforeEach(() => {
    saveFunc = jest.fn()
    logSchema.mockReturnValue({
      save: saveFunc,
    })
    console.log = jest.fn()
  })

  afterEach(() => {
    console.log = originalConsoleLog
  })

  it('On failure, console logs', async () => {
    logSchema.mockImplementation(() => {
      throw new Error('Oh no!!!!!!')
    })
    await _logWithMessage('something')
    expect(logSchema).toHaveBeenCalledWith({ message: 'something' })
    expect(console.log).toHaveBeenCalledWith('Error reaching database')
  })

  it('On success, saves and console logs the message', async () => {
    await _logWithMessage('something')
    expect(saveFunc).toHaveBeenCalledTimes(1)
    expect(logSchema).toHaveBeenCalledWith({ message: 'something' })
    expect(console.log).toHaveBeenCalledWith('info', ':', 'something')
  })
})


describe('log', () => {
  const originalConsoleLog = console.log
  let saveFunc

  beforeEach(() => {
    saveFunc = jest.fn()
    logSchema.mockReturnValue({
      save: saveFunc,
    })
    console.log = jest.fn()
  })

  afterEach(() => {
    console.log = originalConsoleLog
  })

  it('Calls correct function if given an object', async () => {
    await log({ type: 'checkin', message: 'something' })
    expect(saveFunc).toHaveBeenCalledTimes(1)
    expect(logSchema).toHaveBeenCalledWith({ type: 'checkin', message: 'something' })
    expect(console.log).toHaveBeenCalledWith('checkin', ':', 'something')
  })

  it('Calls correct function if given a string', async () => {
    await log('something')
    expect(saveFunc).toHaveBeenCalledTimes(1)
    expect(logSchema).toHaveBeenCalledWith({ message: 'something' })
    expect(console.log).toHaveBeenCalledWith('info', ':', 'something')
  })
})


describe('clearOldLogs', () => {
  const originalConsoleLog = console.log

  beforeEach(() => {
    console.log = jest.fn()
    logSchema.deleteMany = jest.fn()
  })

  afterEach(() => {
    console.log = originalConsoleLog
    jest.useRealTimers()
  })

  it('Console logs on failure', async () => {
    logSchema.deleteMany.mockImplementation(() => {
      throw new Error('Shit')
    })
    await clearOldLogs()
    expect(console.log).toHaveBeenCalledWith('Error reaching database')
  })

  it('Calls clear logs query 90 days ago', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2019-05-29').getTime())
    await clearOldLogs()
    expect(logSchema.deleteMany).toHaveBeenCalledWith({ date: { $lte: 1551315600000}})
  })

  it('Calls clear logs query 90 days ago - again', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2021-10-12').getTime())
    await clearOldLogs()
    expect(logSchema.deleteMany).toHaveBeenCalledWith({ date: { $lte: 1626220800000}})
  })
})