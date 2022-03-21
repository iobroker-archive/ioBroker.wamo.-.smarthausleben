'use strict';

/*
 * Created with @iobroker/create-adapter v2.1.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const axios = require('axios');

const adapterName = require('./package.json').name.split('.').pop();

//Reference to my own adapter
let myAdapter;

// Variable for Timer IDs
let alarm_Intervall_ID;
let short_Intervall_ID;
let long_Intervall_ID;

// Object all possible device commands
const DeviceParameters = {
	empty: {
		id: '',
		statePath: '',
		description: { en: '', de: '' },
		default: {
			value: '',
			description: { en: '', de: '' }
		},
		range: {
			description: { en: '', de: '' },
			cmd: '',
			min: null,
			max: null
		},
		unit: null,
		levelRead: null,
		levelWrite: null,
		readCommand: null,
		writeCommand: null
	},
	TestDefinition: {
		id: 'XXX',
		statePath: 'Testing',
		description: '',
		default: {
			value: null,
			description: { en: 'in µS/cm', de: 'in µS/cm' }
		},
		range: {
			description: { en: '0.0 - 5000 µS/cm', de: '0,0 - 5000µS/cm' },
			cmd: null,
			min: 0,
			max: 5000
		},
		type: 'number',
		unit: 'ttt',
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	Shutoff: {
		id: 'AB',
		statePath: 'Device.Info',
		description: { en: 'Shutoff Valve', de: 'Absperrventiel' },
		default: {
			value: '1',
			description: { en: 'opened', de: 'offen' }
		},
		range: {
			description: { en: '1 openend 2 closed', de: '1 offen 2 geschlossen' },
			cmd: '1,2',
			min: 1,
			max: 2
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	SelectedProfile: {
		id: 'PRF',
		statePath: 'Settings',
		description: { en: 'Aktive Profile', de: 'Aktives Profil' },
		default: {
			value: '1',
			description: { en: '1 (Standard Profile)', de: '1 (Standardprofil)' }
		},
		range: {
			description: { en: '1,2,3,4,5,6,7,8 (1 Standard Profile)', de: '1,2,3,4,5,6,7,8 (1 Standardprofil)' },
			cmd: '1-8',
			min: 1,
			max: 8
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	NumAvailableProfiles: {
		id: 'PRN',
		statePath: 'Device.Info',
		description: { en: 'Number of available Profiles', de: 'Anzahl verfügbarer Profile' },
		default: {
			value: '1',
			description: { en: '1', de: '1' }
		},
		range: {
			description: { en: '1,2,3,4,5,6,7,8', de: '1,2,3,4,5,6,7,8' },
			cmd: '1-8',
			min: 1,
			max: 8
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	ProfileAvailable: {
		id: 'PA',
		statePath: 'Profile',
		description: { en: 'Profile available', de: 'Profil verfügbarer' },
		default: {
			value: '1',
			description: { en: '1', de: '1' }
		},
		range: {
			description: { en: '0 disabled, 1 enabled ', de: '0 deaktiviert, 1 aktiviert' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	ProfileName: {
		id: 'PN',
		statePath: 'Profile',
		description: { en: 'Profile Name', de: 'Profil Name' },
		default: {
			value: 'ANWESEND',
			description: { en: 'AT HOME', de: 'ANWESEND' }
		},
		range: {
			description: { en: '0...31 Characters ', de: '0...31 Zeichen' },
			cmd: '0-31',
			min: 0,
			max: 31
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	ProfileVolumeLevel: {
		id: 'PV',
		statePath: 'Profile',
		description: { en: 'Profile Volume Level', de: 'Profil Volumen Limit' },
		default: {
			value: '300',
			description: { en: '300l', de: '300l' }
		},
		range: {
			description: { en: '0 disabled 1...9000l', de: '0 deaktiviert 1...9000l' },
			cmd: '0-9000',
			min: 0,
			max: 9000
		},
		unit: 'l',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	ProfileTimeLevel: {
		id: 'PT',
		statePath: 'Profile',
		description: { en: 'Profile Time Level', de: 'Profil Zeit Limit' },
		default: {
			value: '60',
			description: { en: '60min', de: '60min' }
		},
		range: {
			description: { en: '0 disabled 1...1500min (25h)', de: '0 deaktiviert 1...1500min (25h)' },
			cmd: '0-1500',
			min: 0,
			max: 1500
		},
		unit: 'min',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	ProfileMaxFlow: {
		id: 'PF',
		statePath: 'Profile',
		description: { en: 'Profile Max Flow', de: 'Profil Maximaler Durchfluss' },
		default: {
			value: '3500',
			description: { en: '3500l/h', de: '3500l/h' }
		},
		range: {
			description: { en: '0 disabled 1...5000l/h', de: '0 deaktiviert 1...5000l/h' },
			cmd: '0-5000',
			min: 0,
			max: 5000
		},
		unit: 'l/h',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	ProfileMicroLeakageDetection: {
		id: 'PM',
		statePath: 'Profile',
		description: { en: 'Micro Leakage Detection', de: 'Microleckage Prüfung' },
		default: {
			value: '1',
			description: { en: '1', de: '1' }
		},
		range: {
			description: { en: '0 disabled, 1 enabled ', de: '0 deaktiviert, 1 aktiviert' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	ProfileReturnTimeToStandardProfile: {
		id: 'PR',
		statePath: 'Profile',
		description: { en: 'Returne Time to Standard Profile', de: 'Zeit bis zum zurückschalten auf das Standardprofil' },
		default: {
			value: '24',
			description: { en: '24h', de: '24h' }
		},
		range: {
			description: { en: '0 disabled 1...720h (30 Days)', de: '0 deaktiviert 1...720h (30 Tage)' },
			cmd: '0-720',
			min: 0,
			max: 720
		},
		unit: 'h',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	ProfileBuzzerOn: {
		id: 'PB',
		statePath: 'Profile',
		description: { en: 'Buzzer ON', de: 'Warnton EIN' },
		default: {
			value: '1',
			description: { en: '1', de: '1' }
		},
		range: {
			description: { en: '0 disabled, 1 enabled ', de: '0 deaktiviert, 1 aktiviert' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	ProfileLeakageWarningOn: {
		id: 'PW',
		statePath: 'Profile',
		description: { en: 'Leackage Warning ON', de: 'Leckage Warnung EIN' },
		default: {
			value: '1',
			description: { en: '1', de: '1' }
		},
		range: {
			description: { en: '0 disabled, 1 enabled ', de: '0 deaktiviert, 1 aktiviert' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	LeakageProtectionTemoraryDisanled: {
		id: 'TMP',
		statePath: 'Device.Settings',
		description: { en: 'Leakage Protection Temorary disabled', de: 'Leckageschutz vorrübergehend deaktiviert' },
		default: {
			value: '0',
			description: { en: 'Leake Protection Aktive', de: 'Leckageschutz ist aktiv' }
		},
		range: {
			description: { en: '0 Leake Protection Aktive / Leake Protectio deactivated for 1...4294967295 Seconds', de: '0 Leckageschutz ist aktiv /  Leckageschutz für 1...4294967295 Sekunden deaktiviert' },
			cmd: '0-4294967295',
			min: 0,
			max: 4294967295
		},
		unit: 's',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	Language: {
		id: 'LNG',
		statePath: 'Device.Settings',
		description: { en: 'Language', de: 'Sprache' },
		default: {
			value: '0',
			description: { en: 'German', de: 'Deutsch' }
		},
		range: {
			description: { en: '0 German 1 English 2 Spanish 3 Italian 4 Polish', de: '0 Deutsch 1 Englisch 2 Spanisch 3 Italienisch 4 Polnisch' },
			cmd: '0-4294967295',
			min: 0,
			max: 4
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	Units: {
		id: 'UNI',
		statePath: 'Device.Settings',
		description: { en: 'Units', de: 'Einheiten' },
		default: {
			value: '0',
			description: { en: '°C/bar/Liter', de: '°C/bar/Liter' }
		},
		range: {
			description: { en: '0 °C/bar/Liter 1 °F/psi/US.liq.gal', de: '0 °C/bar/Liter 1 °F/psi/US.liq.gal' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	MaxFlowLeakageTime: {
		id: 'T2',
		statePath: 'Device.Settings',
		description: { en: 'Max Flow Leakage Time', de: 'Maximale L7h Leckage Zeit' },
		default: {
			value: '1',
			description: { en: '1min', de: '1min' }
		},
		range: {
			description: { en: '0...99 Minutes', de: '0...99 Minuten' },
			cmd: '0-99',
			min: 0,
			max: 99
		},
		unit: 'min',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	FloorSensor: {
		id: 'BSA',
		statePath: 'Device.Settings',
		description: { en: 'Floor Sensor', de: 'Boden Sensor' },
		default: {
			value: '1',
			description: { en: 'enabled', de: 'aktiviert' }
		},
		range: {
			description: { en: '0 disabled 1 Enabled', de: '0 deaktiviert 1 aktiviert' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	MicroLeakageTest: {
		id: 'DMA',
		statePath: 'Device.Settings',
		description: { en: 'Micro Leakage Test', de: 'Microleckagetest' },
		default: {
			value: '1',
			description: { en: 'Warning', de: 'Warnung' }
		},
		range: {
			description: { en: '0 disabled 1 Warning 2 enabled', de: '0 deaktiviert 1 Warnung 2 aktiviert' },
			cmd: '0,1,2',
			min: 0,
			max: 2
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	BuzzerOnAlarm: {
		id: 'BUZ',
		statePath: 'Device.Settings',
		description: { en: 'Buzzer on Alarm', de: 'Warnton bei Alarm' },
		default: {
			value: '1',
			description: { en: 'enabled', de: 'aktiviert' }
		},
		range: {
			description: { en: '0 disabled 1 Warning 2 enabled', de: '0 deaktiviert 1 Warnung 2 aktiviert' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	ConductivityLimit: {
		id: 'CNL',
		statePath: 'Device.Settings',
		description: { en: 'Conductivity Limit', de: 'Limit Leitfähigkeit' },
		default: {
			value: '0',
			description: { en: 'disabled', de: 'deaktiviert' }
		},
		range: {
			description: { en: '0 disabled 1...5000µS/cm', de: '0 deaktiviert 1...5000µS/cm' },
			cmd: '0-5000',
			min: 0,
			max: 5000
		},
		unit: 'µS/cm',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	ConductivityFactor: {
		id: 'CNF',
		statePath: 'Device.Settings',
		description: { en: 'Conductivity Factor', de: 'Multiplikator Leitfähigkeit' },
		default: {
			value: '1',
			description: { en: '1', de: '1' }
		},
		range: {
			description: { en: '0.5...5', de: '0,5...5' },
			cmd: '5-50',
			min: 5,
			max: 50
		},
		unit: '',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	LeakageWarningThreshold: {
		id: 'LWT',
		statePath: 'Device.Settings',
		description: { en: 'Leakage Notification (Warning) Threshold', de: 'Schwelle für Leckage Warnung' },
		default: {
			value: '90',
			description: { en: '90%', de: '90%' }
		},
		range: {
			description: { en: '80...99%', de: '80...99%' },
			cmd: '80-99',
			min: 80,
			max: 99
		},
		unit: '%',
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	FirmwareVersion: {
		id: 'VER',
		statePath: 'Device.Info',
		description: { en: 'Firmware Version', de: 'Firmwareversion' },
		default: {
			value: '',
			description: { en: 'Version', de: 'Version' }
		},
		range: {
			description: { en: null, de: null },
			cmd: null,
			min: null,
			max: null
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	SerialNumber: {
		id: 'SRN',
		statePath: 'Device.Info',
		description: { en: 'Device Serial Number', de: 'Gerät Seriennummer' },
		default: {
			value: '',
			description: { en: 'Serial Number', de: 'Seriennummer' }
		},
		range: {
			description: { en: '9 digits', de: '9 Zahlen' },
			cmd: null,
			min: null,
			max: null
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	CodeNumber: {
		id: 'CNO',
		statePath: 'Device.Info',
		description: { en: 'Device Code Number', de: 'Gerät Codennummer' },
		default: {
			value: '',
			description: { en: 'Code Number', de: 'Codennummer' }
		},
		range: {
			description: { en: '16 characters', de: '16 Zeichen' },
			cmd: null,
			min: null,
			max: null
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	MacAddress: {
		id: 'MAC',
		statePath: 'Device.Info',
		description: { en: 'Device MAC Address', de: 'Gerät MAC Adresse' },
		default: {
			value: '',
			description: { en: 'MAC Address', de: 'MAC Adresse' }
		},
		range: {
			description: { en: 'xx.xx.xx.xx.xx.xx', de: 'xx.xx.xx.xx.xx.xx' },
			cmd: null,
			min: null,
			max: null
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	NextMaintenance: {
		id: 'SRV',
		statePath: 'Device.Info',
		description: { en: 'Next Maintenace Date', de: 'Nächster Service' },
		default: {
			value: '',
			description: { en: 'Date next Maintenance Service', de: 'Datum nächster Service' }
		},
		range: {
			description: { en: 'dd.mm.yyyyy', de: 'tt.mm.jjjj' },
			cmd: null,
			min: null,
			max: null
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	BatteryVoltage: {
		id: 'BAT',
		statePath: 'Device.Info',
		description: { en: 'Battery Voltage', de: 'Batteriespannung' },
		default: {
			value: '',
			description: { en: 'in 1/100V, format x.xx', de: 'in 1/100V, Format x,xx' }
		},
		range: {
			description: { en: 'x.xx', de: 'x,xx' },
			cmd: null,
			min: null,
			max: null
		},
		unit: 'V',
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	DcPowerAdapterVoltage: {
		id: 'NET',
		statePath: 'Device.Info',
		description: { en: 'DC Power Adapter Voltage', de: 'DC Netztei Spannung' },
		default: {
			value: '',
			description: { en: 'in 1/100V, format xx.xx', de: 'in 1/100V, Format xx,xx' }
		},
		range: {
			description: { en: 'xx.xx', de: 'xx,xx' },
			cmd: null,
			min: null,
			max: null
		},
		unit: 'V',
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	Temperature: {
		id: 'CEL',
		statePath: 'Conditions',
		description: { en: 'Water Temperature', de: 'Wassertemperatur' },
		default: {
			value: '',
			description: { en: 'in °F', de: 'in °C' }
		},
		range: {
			description: { en: '0.0 - 212 °F', de: '0,0 - 100°C' },
			cmd: null,
			min: null,
			max: null
		},
		unit: '°',
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	Pressure: {
		id: 'BAR',
		statePath: 'Conditions',
		description: { en: 'Water Pressure', de: 'Wasserdruck' },
		default: {
			value: '',
			description: { en: 'in psi', de: 'in mbar' }
		},
		range: {
			description: { en: 'psi', de: 'mbar' },
			cmd: null,
			min: null,
			max: null
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	Conductivity: {
		id: 'CND',
		statePath: 'Conditions',
		description: { en: 'Water Conductivity', de: 'Wasserleitfähigkeit' },
		default: {
			value: '',
			description: { en: 'in µS/cm', de: 'in µS/cm' }
		},
		range: {
			description: { en: '0.0 - 5000 µS/cm', de: '0,0 - 5000µS/cm' },
			cmd: null,
			min: 0,
			max: 5000
		},
		unit: 'µS/cm',
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	WaterFlow: {
		id: 'FLO',
		statePath: 'Consumption',
		description: { en: 'Water Flow', de: 'Wasserdurchfluss' },
		default: {
			value: '',
			description: { en: 'in l/h', de: 'in l/h' }
		},
		range: {
			description: { en: '0 - 6000 l/h', de: '0 - 6000 l/h' },
			cmd: null,
			min: 0,
			max: 6000
		},
		unit: 'l/h',
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	LastTappedVolume: {
		id: 'LTV',
		statePath: 'Consumption',
		description: { en: 'Last Tapped Volume', de: 'letzte Wasserentnahme' },
		default: {
			value: '',
			description: { en: 'in l', de: 'in l' }
		},
		range: {
			description: { en: null, de: null },
			cmd: null,
			min: null,
			max: null
		},
		unit: 'l',
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	DeaktivateTemperatureSensor: {
		id: 'TSD',
		statePath: 'Settings',
		description: { en: 'Temperatur Sensor ist deaktivated', de: 'Temperatursensor ist deaktiviert' },
		default: {
			value: '0',
			description: { en: 'Temperature Sensor is active', de: 'Temperatursensor ist aktiv' }
		},
		range: {
			description: { en: '0 = activated 1 = deaktivated', de: '0 = aktiviert 1 = deaktiviert' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: 'FACTORY',
		readCommand: 'get',
		writeCommand: 'set'
	},
	DeaktivatePressureSensor: {
		id: 'PSD',
		statePath: 'Settings',
		description: { en: 'Pressure Sensor ist deaktivated', de: 'Drucksensor ist deaktiviert' },
		default: {
			value: '0',
			description: { en: 'Pressure Sensor is active', de: 'Drucksensor ist aktiv' }
		},
		range: {
			description: { en: '0 = activated 1 = deaktivated', de: '0 = aktiviert 1 = deaktiviert' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: 'FACTORY',
		readCommand: 'get',
		writeCommand: 'set'
	},
	DeaktivateConductivitySensor: {
		id: 'CSD',
		statePath: 'Settings',
		description: { en: 'Conductivity Sensor ist deaktivated', de: 'Leitfähigkeitssensor ist deaktiviert' },
		default: {
			value: '0',
			description: { en: 'Conductivity Sensor is active', de: 'Leitfähigkeitssensor ist aktiv' }
		},
		range: {
			description: { en: '0 = activated 1 = deaktivated', de: '0 = aktiviert 1 = deaktiviert' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: 'FACTORY',
		readCommand: 'get',
		writeCommand: 'set'
	},
	WifiKey: {
		id: 'WFK',
		statePath: 'Settings',
		description: { en: 'WiFi Key', de: 'WLAN Passwort' },
		default: {
			value: '',
			description: { en: 'Password', de: 'Passwort' }
		},
		range: {
			description: { en: '8...64 Characters', de: '8-64 Zeichen' },
			cmd: '8-64',
			min: 8,
			max: 64
		},
		unit: null,
		levelRead: null,
		levelWrite: 'USER',
		readCommand: null,
		writeCommand: 'set'
	},
	WifiConnectSsid: {
		id: 'WFC',
		statePath: 'Settings',
		description: {
			en: 'Set WiFi SSID (1-32 characters) and connects to network / Get command returns current saved SSID',
			de: 'Wählt die SSID (1-32 Zeichen) aus und verbindet sich mit dem Netz / Lesekommando gibt die SSID des derzeit verbunden Netzes zurück'
		},
		default: {
			value: '',
			description: { en: 'SSID', de: 'SSID' }
		},
		range: {
			description: { en: '1...32 Characters', de: '1-32 Zeichen' },
			cmd: '1-32',
			min: 1,
			max: 32
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: 'USER',
		readCommand: 'get',
		writeCommand: 'set'
	},
	WifiDisconnect: {
		id: 'WFD',
		statePath: 'Settings',
		description: {
			en: 'Disconnects and forgets current network',
			de: 'Trennt und vergisst das aktuelle Netz'
		},
		default: {
			value: '',
			description: { en: null, de: null }
		},
		range: {
			description: { en: null, de: null },
			cmd: null,
			min: null,
			max: null
		},
		unit: null,
		levelRead: null,
		levelWrite: 'USER',
		readCommand: null,
		writeCommand: 'set'
	},
	WifiState: {
		id: 'WFS',
		statePath: 'Device.Info',
		description: {
			en: 'WiFi state',
			de: 'WLAN Status'
		},
		default: {
			value: '0',
			description: { en: 'disconnected', de: 'getrennt' }
		},
		range: {
			description: { en: '0 = disconnected 1 = connecting 2 = connected', de: '0 = getrennt 1 = am verbinden 2 = verbunden' },
			cmd: '0,1,2',
			min: 0,
			max: 2
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	WifiRssi: {
		id: 'WFR',
		statePath: 'Device.Info',
		description: {
			en: 'WiFi RSSI',
			de: 'WLAN RSSI'
		},
		default: {
			value: '',
			description: { en: 'RSSI strenght in %', de: 'RSSI Stärke in %' }
		},
		range: {
			description: { en: '0...100%', de: '0...100%' },
			cmd: '0-100',
			min: 0,
			max: 100
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	WifiScan: {
		id: 'WFL',
		statePath: 'Device.Info',
		description: {
			en: 'WiFi scann',
			de: 'WLAN Scan'
		},
		default: {
			value: '',
			description: { en: 'JSON List of available WiFis', de: 'JSON Liste der verfügbaren WLANs' }
		},
		range: {
			description: { en: 'JSON list', de: 'JSON Liste' },
			cmd: null,
			min: null,
			max: null
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	IpAddress: {
		id: 'WIP',
		statePath: 'Device.Info',
		description: {
			en: 'IP address',
			de: 'IP Adresse'
		},
		default: {
			value: '',
			description: { en: 'IP4 address 0.0.0.0', de: 'IP4 Adresse 0.0.0.0' }
		},
		range: {
			description: { en: 'IP4 address range', de: 'IP4 Adressbereich' },
			cmd: null,
			min: null,
			max: null
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	DefaultGateway: {
		id: 'WGW',
		statePath: 'Device.Info',
		description: {
			en: 'IP address of the default gateway',
			de: 'IP Adresse des Default-Gateways'
		},
		default: {
			value: '',
			description: { en: 'IP4 address 0.0.0.0', de: 'IP4 Adresse 0.0.0.0' }
		},
		range: {
			description: { en: 'IP4 address range', de: 'IP4 Adressbereich' },
			cmd: null,
			min: null,
			max: null
		},
		unit: null,
		levelRead: 'USER',
		levelWrite: null,
		readCommand: 'get',
		writeCommand: null
	},
	WifiDisableScan: {
		id: 'WNS',
		statePath: 'Device.Settings',
		description: { en: 'Scan for AP before connection', de: 'Vor der Verbindung nach APs suchen' },
		default: {
			value: '0',
			description: { en: 'scan for AP before connection', de: 'Vor der Verbindung nach APs suchen' }
		},
		range: {
			description: { en: '0 = Scan for AP before connection 1 = scan disabled befor connection', de: '0 = Vor der Verbindung nach APs suchen 1 = Vor der Verbindung nicht nach APs suchen' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: '',
		levelRead: 'SERVICE',
		levelWrite: 'SERVICE',
		readCommand: 'get',
		writeCommand: 'set'
	},
	WifiAPhidden: {
		id: 'WAH',
		statePath: 'Device.Settings',
		description: { en: 'Device WiFi AP hidden', de: 'Gerät AP versteckt' },
		default: {
			value: '0',
			description: { en: 'AP not hidden (visible)', de: 'AP nicht versteckt (sichtbar)' }
		},
		range: {
			description: { en: '0 = AP not hidden (visible) 1 = AP hidden (invisible)', de: '0 = AP nicht versteckt (sichtbar) 1 = AP versteckt (unsichtbar)' },
			cmd: '0,1',
			min: 0,
			max: 1
		},
		unit: '',
		levelRead: 'SERVICE',
		levelWrite: 'SERVICE',
		readCommand: 'get',
		writeCommand: 'set'
	},
};


//============================================================================
//=== Funktionen um die Antwortzeiten des HTTP Requests zu ermitteln       ===
//============================================================================
axios.interceptors.request.use(x => {
	x.meta = x.meta || {};
	x.meta.requestStartedAt = new Date().getTime();
	return x;
});

axios.interceptors.response.use(x => {
	x.responseTime = new Date().getTime() - x.config.meta.requestStartedAt;
	return x;
});
//============================================================================


// Load your modules here, e.g.:
// const fs = require("fs");

// ein Kommentar von mir

class Leackagedect extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: adapterName,
		});

		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {


		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info('config Device IP: ' + this.config.device_ip);
		this.log.info('config Device Port: ' + this.config.device_port);

		// ==================================================================================================================
		// =======                                 TESTING															  =======
		// ==================================================================================================================
		this.log.debug('Neue update Funktion Testen');
		try {
			await this.updateState(DeviceParameters.TestDefinition, '224');
		}
		catch (err) {
			this.log.error(`[updateState(DeviceParameters.TestDefinition, '224')] error: ${err}`);
		}
		// ==================================================================================================================

		// Device Initialisation
		this.log.debug('vor initDevice()');
		try {
			const response = await this.initDevice(this.config.device_ip, this.config.device_port);
			this.log.debug(`[initDevice]Response:  ${response}`);
		}
		catch (err) {
			this.log.error(`[initDevice] error: ${err}`);
		}
		this.log.debug('nach initDevice()');

		// Device Profiles Initialisation
		this.log.debug('vor initDeviceProfiles()');
		try {
			const response = await this.initDeviceProfiles(this.config.device_ip, this.config.device_port);
			this.log.debug(`[initDeviceProfiles] Response:  ${response}`);
		}
		catch (err) {
			this.log.error(`[initDeviceProfiles] error: ${err}`);
		}
		this.log.debug('nach initDeviceProfiles()');


		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*//*
		await this.setObjectNotExistsAsync('testVariable', {
			type: 'state',
			common: {
				name: 'testVariable',
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: true,
			},
			native: {},
		});
		*/

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		// this.subscribeStates('testVariable');
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates('lights.*');
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates('*');

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		//await this.setStateAsync('testVariable', true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		//await this.setStateAsync('testVariable', { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync('admin', 'iobroker');
		this.log.info('check user admin pw iobroker: ' + result);

		result = await this.checkGroupAsync('admin', 'admin');
		this.log.info('check group user admin group admin: ' + result);

		// reference to Adapter
		myAdapter = this;

		this.log.info('Adapter wurde gestartet');

		this.log.debug('Alarm Timer init');
		// Die Timer für das Polling starten
		alarm_Intervall_ID = this.setInterval(alarm_poll, 5000);

		// Start des Short Timers um 3 Sekunden verzögern
		await sleep(3000);
		this.log.debug('Short Timer init');
		short_Intervall_ID = this.setInterval(short_poll, parseInt(this.config.device_short_poll_interval) * 1000);

		// Start des Long Timers um 9 Sekunden verzögern
		// da die Anwender die Tendenz ein Vielfaches des Short Timer al Zeit zu verwend ;-)
		await sleep(9000);
		this.log.debug('Long Timer init');
		long_Intervall_ID = this.setInterval(long_poll, parseInt(this.config.device_long_poll_interval) * 1000);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			clearInterval(alarm_Intervall_ID);
			clearInterval(short_Intervall_ID);
			clearInterval(long_Intervall_ID);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === 'object' && obj.message) {
	// 		if (obj.command === 'send') {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info('send command');

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
	// 		}
	// 	}
	// }


	//===================================================
	// Timer EVENTS
	async alarm_TimerTick() {
		return new Promise(async (resolve, reject) => {

			this.log.debug('Alarm Timer tick');
			await this.get_AlarmTimerValues(this.config.device_ip, this.config.device_port);
			try {
				resolve('Ok');
			} catch (err) {
				reject(err);
			}
		});
	}

	async short_TimerTick() {
		return new Promise(async (resolve, reject) => {

			this.log.debug('Short Timer tick');
			await this.get_ShortTimerValues(this.config.device_ip, this.config.device_port);
			try {
				resolve('Ok');
			} catch (err) {
				reject(err);
			}
		});
	}

	async long_TimerTick() {
		return new Promise(async (resolve, reject) => {

			this.log.debug('Long Timer tick');
			try {
				resolve('Ok');
			} catch (err) {
				reject(err);
			}
		});
	}
	//===================================================

	//===================================================
	// Divice Initialisation (called on Adapter Start)
	async initDevice(DeviceIP, DevicePort) {
		return new Promise(async (resolve, reject) => {

			const listOfParameter = [
				'Device.Info.VER', 	// Firmware Version
				'Device.Info.WIP',	// IP Address
				'Device.Info.MAC',	// MAC Address
				'Device.Info.WGW',	// Default Gatewa
				'Device.Info.SRN',	// Serial Number
				'Device.Info.CNO',	// Code Number
				'Device.Info.WFR',	// WiFi RSSI
				'Device.Info.WFC',	// WiFi SSID
				'Device.Info.SRV',	// Next Maintenance
				'Device.Info.WAH',	// WiFi AP Hidden
				'Device.Info.WAD',	// WiFi AP Disabled
				'Device.Info.APT',	// WiFi AP Timeout
				'Device.Info.DWL',	// WiFi Deactivated
				'Device.Info.WFS',	// WiFi State
				'Device.Info.BAT',	// Batterie voltage
				'Conditions.CEL',	// Water temperatur
				'Conditions.CND',	// Water conductivity
				'Device.Info.IDS'];	// Daylight Saving Time


			this.log.debug(`[initDevice()]`);
			let result;
			try {
				for (const stateID of listOfParameter) {
					const parameterIDs = stateID.split('.');
					this.log.debug('current Parameter ID: ' + parameterIDs[parameterIDs.length - 1]);
					result = await this.get_DevieParameter(parameterIDs[parameterIDs.length - 1], DeviceIP, DevicePort);
					this.log.debug('[' + parameterIDs[parameterIDs.length - 1] + '] : ' + String(JSON.stringify(result)));
					await this.UpdateState(stateID, result);
				}
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async initDeviceProfiles(DeviceIP, DevicePort) {
		return new Promise(async (resolve, reject) => {

			// alle 8 möglichen Profile durchlaufen
			for (let ProfileNumber = 1; ProfileNumber < 9; ProfileNumber++) {

				const listOfParameter = [
					'Profiles.' + String(ProfileNumber) + '.PA' + String(ProfileNumber),
					'Profiles.' + String(ProfileNumber) + '.PN' + String(ProfileNumber),
					'Profiles.' + String(ProfileNumber) + '.PV' + String(ProfileNumber),
					'Profiles.' + String(ProfileNumber) + '.PT' + String(ProfileNumber),
					'Profiles.' + String(ProfileNumber) + '.PF' + String(ProfileNumber),
					'Profiles.' + String(ProfileNumber) + '.PM' + String(ProfileNumber),
					'Profiles.' + String(ProfileNumber) + '.PR' + String(ProfileNumber),
					'Profiles.' + String(ProfileNumber) + '.PB' + String(ProfileNumber),
					'Profiles.' + String(ProfileNumber) + '.PW' + String(ProfileNumber)];

				this.log.debug(`[initDeviceProfiles()]`);
				try {
					for (const stateID of listOfParameter) {
						const parameterIDs = stateID.split('.');
						this.log.debug('current Parameter ID: ' + parameterIDs[parameterIDs.length - 1]);
						const result = await this.get_DevieProfileParameter(ProfileNumber, parameterIDs[parameterIDs.length - 1], DeviceIP, DevicePort);
						this.log.debug('[' + parameterIDs[parameterIDs.length - 1] + '] : ' + String(JSON.stringify(result)));
						await this.UpdateProfileState(ProfileNumber, stateID, result);
					}

					resolve(true);
				} catch (err) {
					this.log.error(err.message);
					reject(err);
				}
			}
		});
	}
	//===================================================

	//===================================================
	// Alarm Timer: Get Values  (called on each Alarm Timer Tick)

	async get_AlarmTimerValues(DeviceIP, DevicePort) {
		return new Promise(async (resolve, reject) => {

			const listOfParameter = [
				'Conditions.ALA'];

			this.log.debug(`[get_AlarmTimerValues(DeviceIP, DevicePort)]`);
			let result;
			try {
				for (const stateID of listOfParameter) {
					const parameterIDs = stateID.split('.');
					this.log.debug('current Parameter ID: ' + parameterIDs[parameterIDs.length - 1]);
					result = await this.get_DevieParameter(parameterIDs[parameterIDs.length - 1], DeviceIP, DevicePort);
					this.log.debug('[' + parameterIDs[parameterIDs.length - 1] + '] : ' + String(JSON.stringify(result)));
					await this.UpdateState(stateID, result);
				}
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}
	//===================================================

	//===================================================
	// Short Timer: Get Values  (called on each short Timer Tick)
	async get_ShortTimerValues(DeviceIP, DevicePort) {
		return new Promise(async (resolve, reject) => {

			const listOfParameter = [
				'Conditions.CEL',	// Water temperatur
				'Conditions.CND',	// Water conductivity
				'Device.Info.BAT',
				'Consumptions.AVO',
				'Consumptions.LTV',
				'Consumptions.VOL',
				'Device.Info.NET'];

			this.log.debug(`[get_ShortTimerValues(DeviceIP, DevicePort)]`);
			let result;
			try {
				for (const stateID of listOfParameter) {
					const parameterIDs = stateID.split('.');
					this.log.debug('current Parameter ID: ' + parameterIDs[parameterIDs.length - 1]);
					result = await this.get_DevieParameter(parameterIDs[parameterIDs.length - 1], DeviceIP, DevicePort);
					this.log.debug('[' + parameterIDs[parameterIDs.length - 1] + '] : ' + String(JSON.stringify(result)));
					await this.UpdateState(stateID, result);
				}
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}
	//===================================================

	//===================================================
	// Sets the Adapter State Objects
	// stateID: object path
	// value:	Value for Object
	async UpdateState(stateID, value) {
		return new Promise(async (resolve, reject) => {

			// Parameter ID aus stateID ermitteln
			const parameterIDs = stateID.split('.');
			const parameter = (parameterIDs[parameterIDs.length - 1]).substr(0, parameterIDs[parameterIDs.length - 1].length);
			this.log.debug('[UpdateState(stateID, value)] Parameter = ' + String(parameter));
			try {
				switch (parameter) {
					case 'VER':
						await this.state_VER(value);
						break;
					case 'WIP':
						await this.state_WIP(value);
						break;
					case 'MAC':
						await this.state_MAC(value);
						break;
					case 'WGW':
						await this.state_WGW(value);
						break;
					case 'SRN':
						await this.state_SRN(value);
						break;
					case 'CNO':
						await this.state_CNO(value);
						break;
					case 'WFR':
						await this.state_WFR(value);
						break;
					case 'WFC':
						await this.state_WFC(value);
						break;
					case 'SRV':
						await this.state_SRV(value);
						break;
					case 'WAH':
						await this.state_WAH(value);
						break;
					case 'WAD':
						await this.state_WAD(value);
						break;
					case 'APT':
						await this.state_APT(value);
						break;
					case 'DWL':
						await this.state_DWL(value);
						break;
					case 'WFS':
						await this.state_WFS(value);
						break;
					case 'BAT':
						await this.state_BAT(value);
						break;
					case 'IDS':
						await this.state_IDS(value);
						break;
					case 'ALA':
						await this.state_ALA(value);
						break;
					case 'AVO':
						await this.state_AVO(value);
						break;
					case 'LTV':
						await this.state_LTV(value);
						break;
					case 'VOL':
						await this.state_VOL(value);
						break;
					case 'NET':
						await this.state_NET(value);
						break;
					case 'CEL':
						await this.state_CEL(value);
						break;
					case 'CND':
						await this.state_CND(value);
						break;
				}

				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	//=============================================================================
	// Diese Funktion speichert das übergebene'vValue' im entsprechenden State
	// der in 'stateID' übergebenen Struktur
	//=============================================================================
	async updateState(stateID, value) {
		return new Promise(async (resolve, reject) => {
			try {

				let cur_ParameterID;	// Parameter ID
				let cur_StatePath;		// State Path
				let cur_Description_en;	// english description
				let cur_Description_de;	// german description
				let cur_Unit;			// unit
				let cur_Type;			// data type

				// Parameter ID ermitteln, wenn nciht vorhanden, Error auslösen und abbrechen
				if ('id' in stateID) {
					if (stateID.id == null || stateID.id == '') { throw String(stateID) + 'has no valid (id) key'; }
					cur_ParameterID = stateID.id;
					this.log.debug('id key Value is: ' + cur_ParameterID);
				} else {
					throw String(stateID) + 'has no id key';
				}
				// Den Pafad des States ermittlen -> wenn nicht vorhanden, Error auslösen und abbrechen
				if ('statePath' in stateID) {
					if (stateID.statePath == null || stateID.statePath == '') { throw String(stateID) + 'has no valid (statePath) key'; }
					cur_StatePath = stateID.statePath;
					this.log.debug('(statePath) key Value is: ' + cur_StatePath);
				} else {
					throw String(stateID) + 'has no id statePath';
				}
				// Deutsche und Englische Beschreibung des States ermitteln ->
				// wenn eine Beschreibung fehlt, Error auslösen und abbrechen
				if ('description' in stateID) {
					if(stateID.description == null || stateID.description == ''){
						throw String(stateID) + 'has no description at all (description == null or empty)';
					}
					if ('en' in stateID.description) {
						cur_Description_en = stateID.description.en;
					} else if (// en key nicht vorhanden. Steht die description direkt im description key?
						stateID.description == null || stateID.description == '') {
						// auch keine verwendbare Beschreibung im description key
						throw String(stateID) + 'has no description at all';
					}
					else { cur_Description_en = stateID.description; }
					if ('de' in stateID.description) {
						cur_Description_de = stateID.description.de;
					} else {
						cur_Description_de = '';
					}
				}
				// Einheit des States ermitteln -> wenn nicht vorhanden dan standard leerer string ''
				if ('unit' in stateID) {
					if (cur_Unit != '' && cur_Unit != null) { cur_Unit = stateID.unit; } else { cur_Unit = ''; }
				} else { cur_Unit = ''; }
				// Typ des States ermitteln -> wenn nicht vorhanden dan standard Typ 'string'
				if ('type' in stateID) {
					if (stateID.type != '' && stateID.type != null) { cur_Type = stateID.type; } else { cur_Type = 'string'; }
				} else { cur_Type = 'string'; }

				const state_ID = cur_StatePath + '.' + cur_ParameterID;
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: cur_Description_en,
							de: cur_Description_de
						},
						type: cur_Type,
						role: String(cur_StatePath).toLowerCase() + '.' + String(cur_ParameterID).toLowerCase(),
						unit: cur_Unit,
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value, ack: true });
				this.log.info(cur_Description_en + ' ' + value + ' ' + cur_Unit);
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async UpdateProfileState(ProfileNumber, stateID, value) {
		return new Promise(async (resolve, reject) => {

			const parameterIDs = stateID.split('.');
			const parameter = (parameterIDs[parameterIDs.length - 1]).substr(0, parameterIDs[parameterIDs.length - 1].length - 1);
			this.log.debug('[UpdateProfileState(ProfileNumber, stateID, value)] Profilparameter =' + parameter);
			try {
				switch (parameter) {
					case 'PA':
						await this.state_profile_PA(ProfileNumber, value);
						break;
					case 'PN':
						await this.state_profile_PN(ProfileNumber, value);
						break;
					case 'PV':
						await this.state_profile_PV(ProfileNumber, value);
						break;
					case 'PT':
						await this.state_profile_PT(ProfileNumber, value);
						break;
					case 'PF':
						await this.state_profile_PF(ProfileNumber, value);
						break;
					case 'PM':
						await this.state_profile_PM(ProfileNumber, value);
						break;
					case 'PR':
						await this.state_profile_PR(ProfileNumber, value);
						break;
					case 'PB':
						await this.state_profile_PB(ProfileNumber, value);
						break;
					case 'PW':
						await this.state_profile_PW(ProfileNumber, value);
						break;
					default:
				}

				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	//===================================================
	// Pulls the Information from the Device
	// ParameterID: API command Parameter (last instance of the State path)
	// IPadress: Device IP Adress
	// Port: Device Port
	//===================================================
	// Return: Readed Value from Device (JSON Format)
	async get_DevieParameter(ParameterID, IPadress, Port) {
		return new Promise(async (resolve, reject) => {

			this.log.debug(`[getDevieParameter(ParameterID)] ${ParameterID}`);

			axios({
				method: 'get', url: 'Http://' + String(IPadress) + ':' + String(Port) + '/safe-tec/get/' + String(ParameterID), timeout: 10000, responseType: 'json'
			}
			).then(async (response) => {
				const content = response.data;
				this.log.debug(`[getSensorData] local request done after ${response.responseTime / 1000}s - received data (${response.status}): ${JSON.stringify(content)}`);

				resolve(response.data);
			}
			).catch(async (error) => {
				if (error.response) {
					// The request was made and the server responded with a status code

					this.log.warn(`Warnmeldung`);
				} else if (error.request) {
					// The request was made but no response was received
					// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
					// http.ClientRequest in node.js<div></div>
					this.log.info(error.message);
				} else {
					// Something happened in setting up the request that triggered an Error
					this.log.info(error.message);
				}
				reject('http error');
			});

		});
	}

	async get_DevieProfileParameter(Profile, ParameterID, IPadress, Port) {
		return new Promise(async (resolve, reject) => {

			this.log.debug(`[getDevieParameter(ParameterID)] ${ParameterID}${Profile}`);

			axios({
				method: 'get', url: 'Http://' + String(IPadress) + ':' + String(Port) + '/safe-tec/get/' + String(ParameterID) + String(Profile), timeout: 10000, responseType: 'json'
			}
			).then(async (response) => {
				const content = response.data;
				this.log.debug(`[getSensorData] local request done after ${response.responseTime / 1000}s - received data (${response.status}): ${JSON.stringify(content)}`);

				resolve(response.data);
			}
			).catch(async (error) => {
				if (error.response) {
					// The request was made and the server responded with a status code

					this.log.warn(`Warnmeldung`);
				} else if (error.request) {
					// The request was made but no response was received
					// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
					// http.ClientRequest in node.js<div></div>
					this.log.info(error.message);
				} else {
					// Something happened in setting up the request that triggered an Error
					this.log.info(error.message);
				}
				reject('http error');
			});

		});
	}
	//===================================================

	async state_profile_PA(ProfileNumber, value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Profiles.' + String(ProfileNumber) + '.PA' + String(ProfileNumber);
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Profile ' + String(ProfileNumber) + ' available',
							de: 'Profil ' + String(ProfileNumber) + ' verfügbar'
						},
						type: 'boolean',
						role: 'profile.' + String(ProfileNumber) + '.available',
						read: true,
						write: false
					},
					native: {}
				});
				if (parseFloat(value['getPA' + String(ProfileNumber)]) == 0) {
					this.setStateAsync(state_ID, { val: false, ack: true });
				}
				else {
					this.setStateAsync(state_ID, { val: true, ack: true });
				}
				resolve(true);
			} catch (err) {
				this.log.error(err.message);
				reject(err);
			}
		});

	}

	async state_profile_PN(ProfileNumber, value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Profiles.' + String(ProfileNumber) + '.PN' + String(ProfileNumber);
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Profile ' + String(ProfileNumber) + ' Name',
							de: 'Profil ' + String(ProfileNumber) + ' Name'
						},
						type: 'string',
						role: 'profile.' + String(ProfileNumber) + '.name',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value['getPN' + String(ProfileNumber)], ack: true });
				this.log.info('Profile ' + String(ProfileNumber) + ' Name is ' + value['getPN' + String(ProfileNumber)]);
				resolve(true);
			} catch (err) {
				this.log.error(err.message);
				reject(err);
			}
		});

	}

	async state_profile_PV(ProfileNumber, value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Profiles.' + String(ProfileNumber) + '.PV' + String(ProfileNumber);
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Profile ' + String(ProfileNumber) + ' Volume Level (0 = disabled 1...1900L)',
							de: 'Profil ' + String(ProfileNumber) + ' Volumen Grenze (0 = deaktiviert 1...1900L)'
						},
						type: 'string',
						role: 'profile.' + String(ProfileNumber) + '.volumelevel',
						unit: 'L',
						read: true,
						write: false
					},
					native: {}
				});
				if (parseFloat(value['getPV' + String(ProfileNumber)]) > 0) {
					this.setStateAsync(state_ID, { val: value['getPV' + String(ProfileNumber)], ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Volume Level is ' + value['getPV' + String(ProfileNumber)] + ' min');
				}
				else {
					this.setStateAsync(state_ID, { val: 'disabled', ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Volume Level is disabled');
				}
				resolve(true);
			} catch (err) {
				this.log.error(err.message);
				reject(err);
			}
		});

	}

	async state_profile_PT(ProfileNumber, value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Profiles.' + String(ProfileNumber) + '.PT' + String(ProfileNumber);
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Profile ' + String(ProfileNumber) + ' Time Level (0 = disabled 1...1500min (25h)',
							de: 'Profil ' + String(ProfileNumber) + ' Zeit Grenze (0 = deaktiviert 1...1500min (25h)'
						},
						type: 'string',
						role: 'profile.' + String(ProfileNumber) + '.timelevel',
						unit: 'min',
						read: true,
						write: false
					},
					native: {}
				});
				if (parseFloat(value['getPV' + String(ProfileNumber)]) > 0) {
					this.setStateAsync(state_ID, { val: value['getPT' + String(ProfileNumber)], ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Time Level is ' + value['getPT' + String(ProfileNumber)] + ' min');
				}
				else {
					this.setStateAsync(state_ID, { val: 'disabled', ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Time Level is disabled');
				}
				resolve(true);
			} catch (err) {
				this.log.error(err.message);
				reject(err);
			}
		});

	}

	async state_profile_PF(ProfileNumber, value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Profiles.' + String(ProfileNumber) + '.PF' + String(ProfileNumber);
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Profile ' + String(ProfileNumber) + ' Max Flow (0 = disabled 1...5000L/h)',
							de: 'Profil ' + String(ProfileNumber) + ' Maximaler Durchfluss (0 = deaktiviert 1...5000L/h)'
						},
						type: 'string',
						role: 'profile.' + String(ProfileNumber) + '.maxflow',
						unit: 'L/h',
						read: true,
						write: false
					},
					native: {}
				});
				if (parseFloat(value['getPV' + String(ProfileNumber)]) > 0) {
					this.setStateAsync(state_ID, { val: value['getPF' + String(ProfileNumber)], ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Max Flow is ' + value['getPF' + String(ProfileNumber)] + ' L/h');
				}
				else {
					this.setStateAsync(state_ID, { val: 'disabled', ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Max Flow is disabled');
				}
				resolve(true);
			} catch (err) {
				this.log.error(err.message);
				reject(err);
			}
		});

	}

	async state_profile_PM(ProfileNumber, value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Profiles.' + String(ProfileNumber) + '.PM' + String(ProfileNumber);
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Profile ' + String(ProfileNumber) + ' Microleak Detektion',
							de: 'Profil ' + String(ProfileNumber) + ' Microleckageüberwachung'
						},
						type: 'string',
						role: 'profile.' + String(ProfileNumber) + '.microleakagedetection',
						read: true,
						write: false
					},
					native: {}
				});
				if (parseFloat(value['getPM' + String(ProfileNumber)]) == 0) {
					this.setStateAsync(state_ID, { val: 'disabled', ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Microleak Detektion is disabled');
				}
				else {
					this.setStateAsync(state_ID, { val: 'enabled', ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Microleak Detektion is enabled');
				}
				resolve(true);
			} catch (err) {
				this.log.error(err.message);
				reject(err);
			}
		});

	}

	async state_profile_PR(ProfileNumber, value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Profiles.' + String(ProfileNumber) + '.PR' + String(ProfileNumber);
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Profile ' + String(ProfileNumber) + ' Return Time to standard Profile (1...720h (30 Days))',
							de: 'Profil ' + String(ProfileNumber) + ' Zeit bis zur Rückkehr zum Standardprofil (1...720h (30 Tage))'
						},
						type: 'string',
						role: 'profile.' + String(ProfileNumber) + '.returntime',
						unit: 'h',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value['getPR' + String(ProfileNumber)], ack: true });
				this.log.info('Profile ' + String(ProfileNumber) + ' return time ' + String(value['getPR' + String(ProfileNumber)]));
				resolve(true);
			} catch (err) {
				this.log.error(err.message);
				reject(err);
			}
		});

	}

	async state_profile_PB(ProfileNumber, value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Profiles.' + String(ProfileNumber) + '.PB' + String(ProfileNumber);
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Profile ' + String(ProfileNumber) + ' Buzzer',
							de: 'Profil ' + String(ProfileNumber) + ' Warnton'
						},
						type: 'string',
						role: 'profile.' + String(ProfileNumber) + '.buzzeron',
						read: true,
						write: false
					},
					native: {}
				});
				if (parseFloat(value['getPB' + String(ProfileNumber)]) == 0) {
					this.setStateAsync(state_ID, { val: 'disabled', ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Busser is disabled');
				}
				else {
					this.setStateAsync(state_ID, { val: 'enabled', ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Busser is enabled');
				}
				resolve(true);
			} catch (err) {
				this.log.error(err.message);
				reject(err);
			}
		});

	}

	async state_profile_PW(ProfileNumber, value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Profiles.' + String(ProfileNumber) + '.PW' + String(ProfileNumber);
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Profile ' + String(ProfileNumber) + ' Leakage Warning',
							de: 'Profil ' + String(ProfileNumber) + ' Leckage Warnung'
						},
						type: 'string',
						role: 'profile.' + String(ProfileNumber) + '.leakagewarning',
						read: true,
						write: false
					},
					native: {}
				});
				if (parseFloat(value['getPW' + String(ProfileNumber)]) == 0) {
					this.setStateAsync(state_ID, { val: 'disabled', ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Leakage Warning disabled');
				}
				else {
					this.setStateAsync(state_ID, { val: 'enabled', ack: true });
					this.log.info('Profile ' + String(ProfileNumber) + ' Leakage Warning is enabled');
				}
				resolve(true);
			} catch (err) {
				this.log.error(err.message);
				reject(err);
			}
		});

	}

	async state_ALA(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Conditions.ALA';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Alarm Status',
							de: 'Alarm Status'
						},
						type: 'string',
						role: 'conditions.alarm',
						read: true,
						write: false
					},
					native: {}
				});
				let AlarmText;
				switch (String(value.getALA)) {
					case 'FF':
						AlarmText = 'NO ALARM';
						break;
					case 'A1':
						AlarmText = 'ALARM END SWITCH';
						break;
					case 'A2':
						AlarmText = 'NO NETWORK';
						break;
					case 'A3':
						AlarmText = 'ALARM VOLUME LEAKAGE';
						break;
					case 'A4':
						AlarmText = 'ALARM TIME LEAKAGE';
						break;
					case 'A5':
						AlarmText = 'ALARM MAX FLOW LEAKAGE';
						break;
					case 'A6':
						AlarmText = 'ALARM MICRO LEAKAGE';
						break;
					case 'A7':
						AlarmText = 'ALARM EXT. SENSOR LEAKAGE';
						break;
					case 'A8':
						AlarmText = 'ALARM TURBINE BLOCKED';
						break;
					case 'A9':
						AlarmText = 'ALARM PRESSURE SENSOR ERROR';
						break;
					case 'AA':
						AlarmText = 'ALARM TEMPERATURE SENSOR ERROR';
						break;
					case 'AB':
						AlarmText = 'ALARM CONDUCTIVITY SENSOR ERROR';
						break;
					case 'AC':
						AlarmText = 'ALARM TO HIGH CONDUCTIVITY';
						break;
					case 'AD':
						AlarmText = 'LOW BATTERY';
						break;
					case 'AE':
						AlarmText = 'WARNING VOLUME LEAKAGE';
						break;
					case 'AF':
						AlarmText = 'ALARM NO POWER SUPPLY';
						break;
					default:
						AlarmText = 'undefined';
				}
				this.setStateAsync(state_ID, { val: AlarmText, ack: true });
				this.log.info('Alarm Status: ' + AlarmText);
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_VER(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.VER';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Device Firmware Version',
							de: 'Gerät Firmware Version'
						},
						type: 'string',
						role: 'info.firmware',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getVER, ack: true });
				this.log.info('Device Firmware Version: ' + String(value.getVER));
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_WIP(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.WIP';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Device IP Address',
							de: 'Gerät IP-Adresse'
						},
						type: 'string',
						role: 'info.ip',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getWIP, ack: true });
				this.log.info('Device IP: ' + String(value.getWIP));
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_MAC(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.MAC';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Device MAC Address',
							de: 'Gerät MAC-Adresse'
						},
						type: 'string',
						role: 'info.mac',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getMAC, ack: true });
				this.log.info('Device MAC Address: ' + String(value.getMAC));
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_WGW(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.WGW';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Device Default Gateway',
							de: 'Gerät Standard Gateway'
						},
						type: 'string',
						role: 'info.gateway',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getWGW, ack: true });
				this.log.info('Device Default Gateway: ' + String(value.getWGW));
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_SRN(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.SRN';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Device Serial Number',
							de: 'Gerät Seriennummer'
						},
						type: 'string',
						role: 'info.serial',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getSRN, ack: true });
				this.log.info('Device Serial Number: ' + String(value.getSRN));
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_CNO(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.CNO';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Device Code Number',
							de: 'Gerät Code Nummer'
						},
						type: 'string',
						role: 'info.code',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getCNO, ack: true });
				this.log.info('Device Code Number: ' + String(value.getCND));
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_WFR(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.WFR';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'WiFi RSSI',
							de: 'WLAN RSSI'
						},
						type: 'string',
						role: 'info.rssi',
						unit: '%',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getWFR, ack: true });
				this.log.info('WiFi RSSI is ' + String(value.getWFR) + ' %');
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_WFC(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.WFC';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'WiFi SSID',
							de: 'WLAN SSID'
						},
						type: 'string',
						role: 'info.ssid',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getWFC, ack: true });
				this.log.info('WiFi SSID is ' + String(value.getWFC));
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_WFS(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.WFS';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'WiFi State',
							de: 'WLAN Status'
						},
						type: 'string',
						role: 'info.wifistate',
						read: true,
						write: false
					},
					native: {}
				});
				if (String(value.getWFS) == '0') {
					this.setStateAsync(state_ID, { val: 'disconected', ack: true });
					this.log.info('WiFi is disconected');
				} else if (String(value.getWFS) == '1') {
					this.setStateAsync(state_ID, { val: 'connecting', ack: true });
					this.log.info('WiFi is connecting');
				} else if (String(value.getWFS) == '2') {
					this.setStateAsync(state_ID, { val: 'connected', ack: true });
					this.log.info('WiFi is connected');
				} else {
					this.setStateAsync(state_ID, { val: 'undefined', ack: true });
					this.log.info('WiFi is undefined');
				}
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_SRV(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.SRV';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Next Maintenance',
							de: 'Nächster Service'
						},
						type: 'string',
						role: 'info.service',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getSRV, ack: true });
				this.log.info('Next Maintenance: ' + String(value.getSRV));
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_WAH(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.WAH';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'WiFi AP hidden',
							de: 'WLAN AP versteckt'
						},
						type: 'boolean',
						role: 'info.wifihidden',
						read: true,
						write: false
					},
					native: {}
				});
				if (value.getWAH == '0') {
					this.setStateAsync(state_ID, { val: false, ack: true });
					this.log.info('WiFi AP is not hidden');
				}
				else {
					this.setStateAsync(state_ID, { val: true, ack: true });
					this.log.info('WiFi AP is hidden');
				}
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_WAD(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.WAD';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'WiFi AP disabled',
							de: 'WLAN AP deaktiviert'
						},
						type: 'boolean',
						role: 'info.wifidisabled',
						read: true,
						write: false
					},
					native: {}
				});
				if (String(value.getWAD) == '0') {
					this.setStateAsync(state_ID, { val: false, ack: true });
					this.log.info('WiFi AP is enabled');
				}
				else {
					this.setStateAsync(state_ID, { val: true, ack: true });
					this.log.info('WiFi AP is disabled');
				}
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_APT(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.APT';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'WiFi AP Timeout',
							de: 'WLAN AP Timeout'
						},
						type: 'string',
						role: 'info.wifitimeout',
						unit: 's',
						read: true,
						write: false
					},
					native: {}
				});
				if (parseFloat(value.getAPT) > 0) {
					this.setStateAsync(state_ID, { val: value.getAPT, ack: true });
					this.log.info('WiFi AP Timeout: ' + String(value.getAPT) + ' s');
				}
				else {
					this.setStateAsync(state_ID, { val: 'disabled', ack: true });
					this.log.info('WiFi AP Timeout is Disabled');
				}
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_DWL(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.DWL';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'WiFi deactivate',
							de: 'WLAN deaktivieren'
						},
						type: 'boolean',
						role: 'info.wifideaktivate',
						read: true,
						write: false
					},
					native: {}
				});
				if (String(value.getDWL) == '0') {
					this.setStateAsync(state_ID, { val: false, ack: true });
					this.log.info('WiFi is deactivated');
				}
				else {
					this.setStateAsync(state_ID, { val: true, ack: true });
					this.log.info('WiFi is activated');
				}
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_BAT(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.BAT';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Battery Voltage',
							de: 'Batteriespannung'
						},
						type: 'string',
						role: 'info.batteryvoltage',
						unit: 'V',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getBAT, ack: true });
				this.log.info('Battery Voltage: ' + String(value.getBAT) + ' V');
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_NET(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.NET';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'DC Power Adapter Voltage',
							de: 'DC Netzteil Spannung'
						},
						type: 'string',
						role: 'info.powersupplyvoltage',
						unit: 'V',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getNET, ack: true });
				this.log.info('DC Power Adapter Voltage: ' + String(value.getNET) + ' V');
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_IDS(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Device.Info.IDS';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Daylight saving Time enabled',
							de: 'Sommerzeitumschaltung aktieviert'
						},
						type: 'boolean',
						role: 'info.daylightsavingenabled',
						read: true,
						write: false
					},
					native: {}
				});
				if (String(value.getIDS) == '0') {
					this.setStateAsync(state_ID, { val: false, ack: true });
					this.log.info('Daylight saving Time is disabled');
				}
				else {
					this.setStateAsync(state_ID, { val: true, ack: true });
					this.log.info('Daylight saving Time is enabled');
				}
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_AVO(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Consumptions.AVO';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Currend Water Consumption',
							de: 'Aktuelle Wasserentnahme'
						},
						type: 'string',
						role: 'consumptions.currentvolume',
						unit: 'mL',
						read: true,
						write: false
					},
					native: {}
				});

				this.setStateAsync(state_ID, { val: String(parseFloat(String(value.getAVO).replace('mL', ''))), ack: true });
				this.log.info('Currend Water Consumption: ' + String(parseFloat(String(value.getAVO).replace('mL', ''))) + ' mL');
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_LTV(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Consumptions.LTV';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Last Taped Water',
							de: 'Letzte Wasserentnahme'
						},
						type: 'string',
						role: 'consumptions.lasttapedvolume',
						unit: 'L',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: value.getLTV, ack: true });
				this.log.info('Last Taped Water: ' + String(value.getLTV) + ' L');
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_VOL(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Consumptions.VOL';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Total Water Volume',
							de: 'Gesamte Wasserentnahme'
						},
						type: 'string',
						role: 'consumptions.totalvolume',
						unit: 'm3',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: String(parseFloat(String(value.getVOL).replace('Vol[L]', '')) / 1000), ack: true });
				this.log.info('Total Water Volume: ' + String(parseFloat(String(value.getVOL).replace('Vol[L]', '')) / 1000) + ' m3');
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_CEL(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Conditions.CEL';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Water temperature',
							de: 'Wassertemperatur'
						},
						type: 'string',
						role: 'conditions.watertemp',
						unit: '°C',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: String((parseFloat(String(value.getCEL)) / 10)), ack: true });
				this.log.info('Water temperature: ' + String((parseFloat(String(value.getCEL)) / 10)) + ' °C');
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}

	async state_CND(value) {
		return new Promise(async (resolve, reject) => {
			try {
				const state_ID = 'Conditions.CND';
				await this.setObjectNotExistsAsync(state_ID, {
					type: 'state',
					common: {
						name: {
							en: 'Water conductivitye',
							de: 'Leitfähigkeit'
						},
						type: 'string',
						role: 'conditions.waterconductivity',
						unit: 'uS/cm',
						read: true,
						write: false
					},
					native: {}
				});
				this.setStateAsync(state_ID, { val: String(value.getCND), ack: true });
				this.log.info('Water conductivity: ' + String(value.getCND) + ' uS/cm');
				resolve(true);
			} catch (err) {
				reject(err);
			}
		});
	}
}

//===================================================
// Async Delay Funktion (you can await for delay)
function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

//===================================================
// Timer Event Handler
async function alarm_poll() {
	try {
		await myAdapter.alarm_TimerTick();
	} catch (err) {
		// text
	}
}

async function short_poll() {
	try {
		await myAdapter.short_TimerTick();
	} catch (err) {
		// text
	}
}

async function long_poll() {
	try {
		await myAdapter.long_TimerTick();
	} catch (err) {
		// text
	}
}
//===================================================

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Leackagedect(options);
} else {
	// otherwise start the instance directly
	new Leackagedect();
}


