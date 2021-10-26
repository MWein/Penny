const { sleep } = require('./sleep')

describe('sleep', () => {
  it('Resolves promise', () => {
    return expect(sleep(0.1)).resolves.toBe(undefined)
  })

  describe('setTimeout stub tests', () => {
    beforeAll(() => {
      jest.useFakeTimers()
      jest.spyOn(global, 'setTimeout')
    })
    afterAll(() => {
      jest.useRealTimers()
    })

    it('Sleeps for 1 second, calls setTimeout with sec*1000', () => {
      sleep(1)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000)
    })
    it('Sleeps for 10 seconds, calls setTimeout with sec*1000', () => {
      sleep(10)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 10000)
    })
    it('Sleeps for 0.7 seconds, calls setTimeout with sec*1000', () => {
      sleep(0.7)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 700)
    })
  })
})