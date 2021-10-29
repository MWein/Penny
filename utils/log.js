const logSchema = require('../db_models/logSchema')


// Log data is the object that will go directly to Mongo
const _logWithObject = async logData => {
  try {
    const newLog = new logSchema(logData)
    await newLog.save()
    if (logData.type !== 'ping') {
      console.log(logData.type || 'info', ':', logData.message)
    }
  } catch (e) {
    console.log('Error reaching database')
  }
}


const _logWithMessage = async message => {
  try {
    const newLog = new logSchema({
      message,
    })
    await newLog.save()
    console.log('info', ':', message)
  } catch (e) {
    console.log('Error reaching database')
  }
}


const log = async logData => {
  const logFunc = typeof logData === 'string' ? _logWithMessage : _logWithObject
  await logFunc(logData)
}


const clearOldLogs = async () => {
  try {
    const DELETEOLDERTHANDAYS = 90
    const today = new Date()
    const priorDate = new Date().setDate(today.getDate() - DELETEOLDERTHANDAYS)
    await logSchema.deleteMany({ date: { $lte: priorDate } })
  } catch (e) {
    console.log('Error reaching database')
  }
}


module.exports = {
  _logWithObject,
  _logWithMessage,
  log,
  clearOldLogs,
}