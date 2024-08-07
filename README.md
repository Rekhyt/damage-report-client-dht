# damage-report-client-dht
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/Rekhyt/damage-report-client-dht.svg?branch=master)](https://travis-ci.org/Rekhyt/damage-report-client-dht)
[![npm](https://img.shields.io/npm/v/damage-report-client-dht)](https://www.npmjs.com/package/damage-report-client-dht)

Reports temperature &amp; humidity data of a DHT sensor in a Raspberry Pi to the
[damage-report](https://github.com/Rekhyt/damage-report) service.

## Quick Start
This is a single standalone CLI script. I recommend installing it globally:

`npm i -g damage-report-client-dht`

Start a simulation:

`TYPE=22 PIN=4 API_URL=http://locahost:8000 LOCATION_ID=kitchen LOCATION_NAME=Kitchen SIMULATE=1 damage-report-client-dht`

Start monitoring sensors (tested on Raspberry Pi only):

`TYPE=22 PIN=4 API_URL=http://locahost:8000 LOCATION_ID=kitchen LOCATION_NAME=Kitchen damage-report-client-dht`

## Environment Variables
* `TYPE` - **(required)** - One of 11 or 22 for the DHT11 or DHT22/AM2302 respectively.
* `PIN` - **(required)** - The GPIO pin that the sensor is connected to.
* `API_URL` - **(required)** - The URL to the damage-report API.
* `LOCATION_ID` - **(required)** - ID of the location of the sensor.
* `LOCATION_NAME` - **(optional)** - Name of the location of the sensor. Defaults to the location ID.
* `RELAY_PIN` - **(optional)** - The GPIO pin of a relay used to shortly turn of the sensors when reading fails. Defaults to null.
* `RELAY_TIME` - **(optional)** - The time (ms) that the sensor should be turned off when reading fails. Defaults to 2500.
* `TIMEOUT` - **(optional)** - The time (ms) to wait for a signal until starting a new try. Defaults to 5000.
* `CRON_PATTERN` - **(optional)** - A cron pattern describing when to update. Defaults to "* * * * *" (every minute).
* `SIMULATE` - **(optional)** - Set to "true" to skip reading sensors and send random data instead. Defaults to false.
* `LOGGLY_SUBDOMAIN` - **(optional)** - The loggly.com sub domain to log to. If falsy logs go to stdout only.
* `LOGGLY_TOKEN` - **(optional)** - A loggly.com access token. If falsy logs go to stdout only.
* `CONFIG_PATH` - **(optional)** - Path to a .env-style file to load environment variables from. Defaults to ".env".

## .env
Use `CONFIG_PATH` to specify a `.env`-style file to be used:

`CONFIG_PATH=~/.config/dht-env damage-report-client-dht`

## Cron Pattern
Cron patterns can be standard unix 5 column or non-standard 6 column. When using 6 columns, the first describes seconds.

See https://en.wikipedia.org/wiki/Cron for reference.

## Running With Docker
It is necessary to run the container in `privileged` mode and with hardware mounts due to its hardware-related nature.

### Run From Docker Hub
Run the container:

    docker run \
    --name damage-report-client-dht \
    --privileged -dv /sys/class/gpio:/sys/class/gpio \
    -e TYPE=DHT22 \
    -e PIN=4 \
    -e LOCATION_ID=kitchen \
    -e LOCATION_NAME=Kitchen \
    -e API_URL=http://localhost:8080 \
    lapwing/damage-report-client-dht

### Build & Run Locally
Build the container:

`docker build -t dht-client .`

Run the container:

    docker run \
    --name damage-report-client-dht \
    --privileged -d
    -v /sys/class/gpio:/sys/class/gpio \
    -e TYPE=DHT22 \
    -e PIN=4 \
    -e LOCATION_ID=kitchen \
    -e LOCATION_NAME=Kitchen \
    -e API_URL=http://localhost:8080 \
    dht-client

## Relay PIN & Time
Sometimes the DHT sensors will stop delivering data. The easiest fix to this seems to be cutting power for a short time.

To do this, install a relay on the power line of the sensor, then set the `RELAY_PIN` env to the GPIO that connects to
the relay's trigger pin.

If `RELAY_PIN` is set it will be set to "HIGH" for 2500 ms (or what's in `RELAY_TIME`) after 3 consecutive read failures.


## Changelog
See [CHANGELOG](CHANGELOG.md) for a list of changes.
