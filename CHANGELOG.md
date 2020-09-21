# Changelog

## [Unreleased]
### Fixed
* usage of console.log / console.error when it should use bunyan
* unhandled promise rejection when reading the sensor fails right away (no time out)

### Added
* instance specific data such as locationId, name, DHT type and API URL to all log messages

## [1.0.2] - 2020-09-09
### Fixed
* updated vulnerable dependencies
* build status badge in README.md

## [1.0.1] - 2020-03-22
### Fixed
* cosmetics, typos, readme

## 1.0.0 - 2020-03-21
Initial release.

[Unreleased]: https://github.com/Rekhyt/damage-report-client-dht/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/Rekhyt/damage-report-client-dht/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Rekhyt/damage-report-client-dht/compare/v1.0.0...v1.0.1
