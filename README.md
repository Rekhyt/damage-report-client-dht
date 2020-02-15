# damage-report-client-dht
Reports temperature &amp; humidity data of a DHT sensor in a Raspberry Pi to the
[damage-report](https://github.com/Rekhyt/damage-report) service.

## Environment Variables
* `TYPE` - **(required)** One of 11 or 22 for the DHT11 or DHT22/AM2302 respectively.
* `PIN` - **required** The GPIO pin that the sensor is connected to.
* `API_URL` - **required** The URL to the damage-report API.
* `LOCATION_ID` - **required** ID of the location of the sensor.
* `LOCATION_NAME` -  Name of the location of the sensor. Defaults to the location ID.
* `TIMEOUT` - The time (ms) to wait for a signal until starting a new try. Defaults to 5000.
* `INTERVAL` - The time (ms) to wait between checking the sensors. Defaults to 60000.
* `SIMULATE` - If truthy, the actual sensor is not called, instead new data is randomly generated every 5 seconds.

## Usage
Start a simulation:

`TYPE=22 PIN=4 API_URL=http://locahost:8000 LOCATION_ID=kitchen LOCATION_NAME=Kitchen SIMULATE=1 npm start`

Start monitoring sensors (tested on Raspberry Pi only):
`TYPE=22 PIN=4 API_URL=http://locahost:8000 LOCATION_ID=kitchen LOCATION_NAME=Kitchen npm start`