'use strict';
// node.js packages needed for this application
const http = require('http');
var assert = require('assert');
const express= require('express');
// create Express object used to represent web app
const app = express();
const mustache = require('mustache');
const filesystem = require('fs');
const url = require('url');
const port = Number(process.argv[2]);

const hbase = require('hbase')
// host:'localhost', port:8070
var hclient = hbase({ host: process.argv[3], port: Number(process.argv[4])})


function rowToMap(row) {
	var stats = {}
	row.forEach(function (item) {
		stats[item['column']] = Number(item['$'])
	});
	return stats;
}

// hclient.table('weather_delays_by_route').row('ORDAUS').get((error, value) => {
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

app.get('/airline-ontime.html', function (req, res) {
	hclient.table('yson_carriers').scan({ maxVersions: 1}, (err,rows) => {
		var template = filesystem.readFileSync("airline-ontime.mustache").toString();
		var html = mustache.render(template, {
			streets : rows
		});
		res.send(html)
	})
});

function removePrefix(text, prefix) {
	return text.substr(prefix.length)
}

app.get('/airline-ontime-delays.html',function (req, res) {
	const street = req.query['airline'];
	console.log(street);
	function processSegmentIdRecord(segmentIdRecord) {
		var result = { aaaaa : segmentIdRecord['year']};
		["all_ontime", "clear_ontime"].forEach(val => {
			result[val] = segmentIdRecord[val];
		})
		return result;
	}
	function StreetInfo(cells) {
		var result = [];
		var segmentIdRecord;
		cells.forEach(function(cell) {
			var segment_id = Number(removePrefix(cell['key'], street))
			console.log(segment_id)
			if(segmentIdRecord === undefined)  {
				segmentIdRecord = { year: segment_id }
			} else if (segmentIdRecord['year'] != segment_id ) {
				result.push(processSegmentIdRecord(segmentIdRecord))
				segmentIdRecord = { year: segment_id }
			}
			segmentIdRecord[removePrefix(cell['column'],'stats:')] = cell['$']
		})
		result.push(processSegmentIdRecord(segmentIdRecord))
		console.info(result)
		return result;
	}

	hclient.table('yson_ontime_by_year').scan({
			filter: {type : "PrefixFilter",
				value: street},
			maxVersions: 1},
		(err, cells) => {
			var ai = StreetInfo(cells);
			var template = filesystem.readFileSync("ontime-result.mustache").toString();
			var html = mustache.render(template, {
				StreetInfo : ai,
				street : street
			});
			res.send(html)

		})
});

app.listen(port);
