const bunyan = require('bunyan')
const request = require('request-promise-native')
const sensor = require('node-dht-sensor').promises

if (!process.env.TYPE || !process.env.PIN || !process.env.API_URL || !process.env.LOCATION_ID) {
  console.error('Environment variables TYPE, PIN and API_URL must be set.')
  console.log('Available environment variables:')
  console.log('TYPE          - required - One of 11 or 22 for the DHT11 or DHT22/AM2302 respectively.')
  console.log('PIN           - required - The GPIO pin that the sensor is connected to.')
  console.log('API_URL       - required - The URL to the damage-report API.')
  console.log('LOCATION_ID   - required - ID of the location of the sensor.')
  console.log('LOCATION_NAME - optional - Name of the location of the sensor. Defaults to the location ID.')
  console.log('TIMEOUT       - optional - The time (ms) to wait for a signal until starting a new try. Defaults to 5000.')
  console.log('INTERVAL      - optional - The time (ms) to wait between checking the sensors. Defaults to 60000.')
  process.exit(1)
}

const logger = bunyan.createLogger({ name: 'damage-report-client-dht' })

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
  await processor()
  const interval = setInterval(processor, process.env.INTERVAL || 60000)

  process.on('SIGINT', () => {
    clearInterval(interval)
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
    const timer = setTimeout(() => reject('Error reading sensors.'), timeout)

    const data = await sensor.read(type, pin)
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
