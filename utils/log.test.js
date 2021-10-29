const logSchema = require('../db_models/logSchema')
jest.mock('../db_models/logSchema')

const {
  _logWithObject,
  _logWithMessage,
  log
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
    await _logWithObject({ type: 'checkin', message: 'something' })
    expect(saveFunc).toHaveBeenCalledTimes(1)
    expect(logSchema).toHaveBeenCalledWith({ type: 'checkin', message: 'something' })
    expect(console.log).toHaveBeenCalledWith('checkin', ':', 'something')
  })

  it('On success, saves and console logs the message; console log says \'info\' if type is not provided', async () => {
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