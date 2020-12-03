'use strict';
const http = require('http');
var assert = require('assert');
const express= require('express');
const app = express();
const mustache = require('mustache');
const filesystem = require('fs');
const url = require('url');
const port = Number(process.argv[2]);

const hbase = require('hbase')
// host:'localhost', port:8070
var hclient = hbase({ host: process.argv[3], port: Number(process.argv[4])})

// function rowToMap(row) {
// 	var stats = {}
// 	row.forEach(function (item) {
// 		stats[item['column']] = Number(item['$'])
// 	});
// 	return stats;
// }
// hclient.table('yson_street_by_seg').row('W Washington950').get((error, value) => {
// 	console.info(rowToMap(value))
// 	console.info(value)
// })
//
// hclient.table('spertus_carriers').scan({ maxVersions: 1}, (err,rows) => {
// 	console.info(rows)
// })
//
// hclient.table('spertus_ontime_by_year').scan({
// 	filter: {type : "PrefixFilter",
// 		      value: "AA"},
// 	maxVersions: 1},
// 	(err, value) => {
// 	  console.info(value)
// 	})

app.use(express.static('public'));
app.get('/traffic.html', function (req, res) {
	hclient.table('yson_streets').scan({ maxVersions: 1}, (err,rows) => {
		var template = filesystem.readFileSync("submit.mustache").toString();
		var html = mustache.render(template, {
			streets : rows
		});
		res.send(html)
	})
});

function removePrefix(text, prefix) {
	return text.substr(prefix.length)
}
function byteToInt(x){
	let val=0;
	for (let i=0; i<x.length; ++i) {
		val+=x[i];
		if(i<x.length-1) val = val << 8;
	}
	return val;
}
function counterToNumber(c) {
	return Number(Buffer.from(c).readInt32BE());
}
app.get('/street-results.html',function (req, res) {
	const street = req.query['street'];
	console.log(street); // print street name
	function processSegmentIdRecord(segmentIdRecord) {
		var result = { segment_id : segmentIdRecord['segment_id']};
		["from_street", "to_street", "traffic_direction",
			"speed_month", "speed_week", "speed_day", "speed_hour", "speed_now"].forEach(val => {
			if (val == "speed_now") {
				if (counterToNumber(segmentIdRecord[val]) != 0) {
					result[val] = counterToNumber(segmentIdRecord[val]);
				} else {
					result[val] = "-"
				}
			} else {
				result[val] = segmentIdRecord[val];
			}
		})
		return result;
	}
	function SpeedInfo(cells) {
		var result = [];
		var segmentIdRecord;
		cells.forEach(function(cell) {
			var segment_id = Number(removePrefix(cell['key'], street))
			if(segmentIdRecord === undefined)  {
				segmentIdRecord = { segment_id: segment_id }
			} else if (segmentIdRecord['segment_id'] != segment_id ) {
				result.push(processSegmentIdRecord(segmentIdRecord))
				segmentIdRecord = { segment_id: segment_id }
			}
			segmentIdRecord[removePrefix(cell['column'],'stats:')] = cell['$']
		})
		result.push(processSegmentIdRecord(segmentIdRecord))
		return result;
	}
	function processRedlightSpeedRecord(streetRecord) {
		var result = { street : streetRecord['street_name']};
		["redlight_year", "redlight_months", "speed_year", "speed_months"].forEach(val => {
			if (streetRecord[val] === undefined) {
				result[val] = "-"
			} else {
				result[val] = streetRecord[val];
			}
		})
		return result;
	}
	function RedlightSpeedInfo(cells) {
		var result = [];
		var streetRecord;
		// console.log(streetRecord)
		cells.forEach(function(cell) {
			var street_name = cell['key']

			if(streetRecord === undefined)  {
				streetRecord = { street_name: street_name }
				// console.log(streetRecord)
			} else if (streetRecord['street_name'] != street_name ) {
				result.push(processRedlightSpeedRecord(streetRecord))
				streetRecord = {street_name: street_name}
			}
			streetRecord[removePrefix(cell['column'],'stats:')] = cell['$']
		})
		result.push(processRedlightSpeedRecord(streetRecord))
		return result;
	}
	function processCrashRecord(crashIdRecord) {
		var result = { crash_record_id : crashIdRecord['crash_record_id']};
		["crash_date", "street", "address", "first_crash_type", "crash_type", "prim_cause", "damage"].forEach(val => {
			result[val] = crashIdRecord[val];
		})
		return result;
	}
	function CrashInfo(cells) {
		var result = [];
		var crashIdRecord
		cells.forEach(function(cell) {
			var crash_record_id = removePrefix(cell['key'], street)
			// console.log(crash_record_id)
			if(crashIdRecord === undefined)  {
				crashIdRecord = { crash_record_id: crash_record_id }
			} else if (crashIdRecord['crash_record_id'] != crash_record_id) {
				result.push(processCrashRecord(crashIdRecord))
				crashIdRecord = { crash_record_id: crash_record_id }
			}
			crashIdRecord[removePrefix(cell['column'],'stats:')] = cell['$']
		})
		result.push(processCrashRecord(crashIdRecord))
		return result;
	}


	hclient.table('yson_street_by_seg').scan({
			filter: {type : "PrefixFilter", value: street},
			maxVersions: 1},
		(err, cells) => {
			var si = SpeedInfo(cells);
			// console.log(si);
			hclient.table('yson_redlight_speed').scan({
					filter: {type : "PrefixFilter", value: street},
					maxVersions: 12},
				(err, cells) => {
					if (cells.length > 0) {
						var rsi = RedlightSpeedInfo(cells);
					} else {
						var rsi = undefined;
					}
					console.log(rsi);
					hclient.table('yson_crashes_month').scan({
							filter: {type : "PrefixFilter", value: street},
							maxVersions: 1},
						(err, cells) => {
							if (cells.length > 0) {
								var ci = CrashInfo(cells);
							} else {
								var ci = undefined;
							}
							// var ci = CrashInfo(cells);
							// console.log(ci);
							var template = filesystem.readFileSync("result-table.mustache").toString();
							var html = mustache.render(template, {
								SpeedInfo: si,
								street: street,
								RedlightSpeedInfo: rsi,
								CrashInfo: ci
							});
							res.send(html)
						})
				})
		})
});

app.listen(port);
