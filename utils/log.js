const logSchema = require('../db_models/logSchema')


// Log data is the object that will go directly to Mongo
const _logWithObject = async logData => {
  try {
    const newLog = new logSchema(logData)
    await newLog.save()
    console.log(logData.type || 'info', ':', logData.message)
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
  console.log(typeof logData)
  if (typeof logData === 'string') {
    await _logWithMessage(logData)
  } else {
    await _logWithObject(logData)
  }
}


module.exports = {
  _logWithObject,
  _logWithMessage,
  log
}