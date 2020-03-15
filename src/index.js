#!/usr/bin/env node

const bunyan = require('bunyan')
const request = require('request-promise-native')
const sensor = require('node-dht-sensor').promises
const CronJob = require('cron').CronJob

if (!process.env.TYPE || !process.env.PIN || !process.env.API_URL || !process.env.LOCATION_ID) {
  console.error('Environment variables TYPE, PIN and API_URL must be set.\n')
  console.log('Available environment variables:')
  console.log('TYPE             - required - One of 11 or 22 for the DHT11 or DHT22/AM2302 respectively.')
  console.log('PIN              - required - The GPIO pin that the sensor is connected to.')
  console.log('API_URL          - required - The URL to the damage-report API.')
  console.log('LOCATION_ID      - required - ID of the location of the sensor.')
  console.log('LOCATION_NAME    - optional - Name of the location of the sensor. Defaults to the location ID.')
  console.log('TIMEOUT          - optional - The time (ms) to wait for a signal until starting a new try. Defaults to 5000.')
  console.log('CRON_PATTERN     - optional - A cron pattern (1) describing when to update. Defaults to "* * * * *" (every minute).')
  console.log('SIMULATE         - optional - Set to "true" to skip reading sensors and send random data instead. Defaults to false.')
  console.log('LOGGLY_SUBDOMAIN - optional - The loggly.com sub domain to log to. If falsy logs go to stdout only.')
  console.log('LOGGLY_TOKEN     - optional - A loggly.com access token. If falsy logs go to stdout only.')
  console.log()
  console.log('(1) Prepend a column for seconds granularity, e.g. every 13th second: "13 * * * * *')
  process.exit(1)
}

const logStreams = [{ stream: process.stdout }]
if (process.env.LOGGLY_SUBDOMAIN && process.env.LOGGLY_TOKEN) {
  logStreams.push({
    type: 'raw',
    stream: new (require('bunyan-loggly'))({
      subdomain: process.env.LOGGLY_SUBDOMAIN,
      token: process.env.LOGGLY_TOKEN
    })
  })
}

const logger = bunyan.createLogger({ name: 'damage-report-client-dht', streams: logStreams })

let simulationInterval
if (process.env.SIMULATE) {
  updateSimulation()
  simulationInterval = setInterval(updateSimulation, 5000)
}

exec().catch(err => {
  logger.error(err)
  process.exit(1)
})

async function exec () {
  const job = new CronJob(process.env.CRON_PATTERN || '* * * * *', processor)
  job.start()

  process.on('SIGINT', () => {
    job.stop()
    clearInterval(simulationInterval)
    logger.info('Got SIGINT, terminating . . .')
    process.exit(0)
  })
}

async function processor () {
  try {
    logger.info('Fetching . . .')
    const data = await read(process.env.TYPE, process.env.PIN, process.env.TIMEOUT || 5000)
    logger.info('Got data', data)

    const command = {
      name: 'ClimateData.updateData',
      payload: {
        locationId: process.env.LOCATION_ID,
        locationName: process.env.LOCATION_NAME || process.env.LOCATION_ID,
        temperature: data.temperature.toFixed(1),
        humidity: data.humidity.toFixed(1)
      }
    }

    logger.info('Sending command to ' + process.env.API_URL + '/command', JSON.stringify(command, null, 2))
    await request({
      url: `${process.env.API_URL}/command`,
      method: 'post',
      json: true,
      body: command
    })
  } catch (err) {
    logger.error(err)
  }
}

async function read (type, pin, timeout) {
  return new Promise(async (resolve, reject) => {
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      reject('Error reading sensors.')
    }, timeout)

    const data = await sensor.read(type, pin)

    if (timedOut) return

    clearTimeout(timer)
    resolve(data)
  })

}

function updateSimulation () {
  sensor.initialize({
    test: {
      fake: {
        temperature: Math.random() * 10,
        humidity: Math.random() * 10
      }
    }
  })
}
