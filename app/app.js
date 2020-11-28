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

// convert to dictionary for better form
function rowToMap(row) {
	var stats = {}
	if (row == null) {
		return ("Nothing Returned")
	}
	row.forEach(function (item) {
		stats[item['column']] = Number(item['$'])
	});
	return stats;
}

// hclient.table('yson_hw6').row('AA2018').get((error, value) => {
// 	console.info(rowToMap(value))
// 	// console.info(value)
// })
// hclient.table('yson_traffic_times').row('99').get((error, value) => {
// 	// console.info(rowToMap(value))
// 	console.info(value)
// })
//
// hclient.table('spertus_carriers').scan({ maxVersions: 1}, (err,rows) => {
// 	console.info(rowToMap(value))
// 	console.info(rows)
// })
//
// hclient.table('spertus_ontime_by_year').scan({
// 		filter: {type : "PrefixFilter",
// 			value: "AA"},
// 		maxVersions: 1},
// 	(err, value) => {
// 		console.info(value)
// 	})

// look for static html pages it the 'public' directory
// Tell express to statically serve files in the public dir
// for web requests that are not handled dynamically by Node.js
app.use(express.static('public'));
// any requests should call this func with web request and response as args
app.get('/ontime.html',function (req, res) {
    const route=req.query['carrier'] + req.query['year']; //ORDAUS
    console.log(route);
    // request to hbase for a route
	hclient.table('yson_hw6').row(route).get(function (err, cells) {
		const weatherInfo = rowToMap(cells);
		console.log(weatherInfo)
		function weather_ontime(weather) {
			return (weatherInfo["ontime:" + weather + "_ontime_dep"])
		}
		var template = filesystem.readFileSync("result.mustache").toString();
		var html = mustache.render(template,  {
			carrier : req.query['carrier'],
			year : req.query['year'],
			all_ontime : weather_ontime("all"),
			fog_ontime : weather_ontime("fog"),
			rain_ontime : weather_ontime("rain"),
			snow_ontime : weather_ontime("snow"),
			hail_ontime : weather_ontime("hail"),
			thunder_ontime : weather_ontime("thunder"),
			tornado_ontime : weather_ontime("tornado")
		});
		res.send(html);
	});
});
	
app.listen(port);
