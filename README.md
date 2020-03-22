# damage-report-client-dht
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/Rekhyt/damage-report-client-dht.svg?branch=master)](https://travis-ci.org/Rekhyt/damage-report)
[![npm](https://img.shields.io/npm/v/damage-report-client-dht)](https://www.npmjs.com/package/damage-report-client-dht)

Reports temperature &amp; humidity data of a DHT sensor in a Raspberry Pi to the
[damage-report](https://github.com/Rekhyt/damage-report) service.

## Installation
This is a single standalone CLI script. I recommend installing it globally:

`npm i -g damage-report-client-dht`

## Environment Variables
Run `damage-report-client-dht` to get the list of available environment variables for configuration.

Use `CONFIG_PATH` to specify a `.env`-style file to be used:

`CONFIG_PATH=~/.config/dht-env damage-report-client-dht`

## Usage
Start a simulation:

`TYPE=22 PIN=4 API_URL=http://locahost:8000 LOCATION_ID=kitchen LOCATION_NAME=Kitchen SIMULATE=1 damage-report-client-dht`

Start monitoring sensors (tested on Raspberry Pi only):
`TYPE=22 PIN=4 API_URL=http://locahost:8000 LOCATION_ID=kitchen LOCATION_NAME=Kitchen damage-report-client-dht`

## Changelog
See [CHANGELOG](CHANGELOG.md) for a list of changes.
