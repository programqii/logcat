var adb_path = "C:\\adt-bundle-windows-x86_64\\sdk\\platform-tools\\adb";
var perl_path = "C:\\cygwin\\bin\\perl";

var child_process = require('child_process'),
	express_io=require('express.io');
var util = require('util'),
	colors = require('colors'),
	app = express_io(),
	spawn = child_process.spawn,
	state = {
		'success': ['success', 'D\/DroidGap', 'D\/CordovaLog'],
		'error': ['error', 'E\/'],
		'warning': ['warning', 'W\/Web Console'],
		'info': ['info']
	},
	mech_png = require('mech-png'),
	event_capture = spawn(adb_path, ['shell', 'getevent']),
	logcat = spawn(adb_path, ['logcat']);
var globalEventInfo = {}; //for/from EventCapture

function convertEachToInt10(element, index, array) {array[index]= parseInt(element, 10);}
app.http().io();
app.get('/', function(req, res) {res.sendfile(__dirname + '/public/index.html');});
app.use('/static', express_io.static(__dirname + '/public'));
app.get('/android/eventdevlist', function(req, res) {res.send(globalEventInfo);});

function diffMs(timer) {
	var diff = process.hrtime(timer);
	return ((diff[0] * 1e9 + diff[1])*1e-9 ) + "s";}
var dims = [100,100];
	child_process.exec(adb_path + " shell dumpsys window", function (error, stdout, stderr) {
		
		dims = stdout.match(/DisplayWidth=([0-9]+) +DisplayHeight=([0-9]+)/).slice(1);
		dims.forEach(convertEachToInt10);
	});
app.get('/android/screen.png', function(req, res) {
	var timer = process.hrtime();
/*
	child_process.exec(adb_path + " shell dumpsys window", function (error, stdout, stderr) {
		
		var dims = stdout.match(/DisplayWidth=([0-9]+) +DisplayHeight=([0-9]+)/).slice(1);
		dims.forEach(convertEachToInt10);
*/
		//console.log("Exec dumpsys: " +diffMs(timer));timer = process.hrtime();
		child_process.exec(adb_path + " shell \"cat /dev/graphics/fb0\"",
		{encoding: 'binary', maxBuffer:dims[0]*dims[1]*4*3},
		function (error, stdout, stderr) {
			stdout = stdout.replace(/\r\r\n/g, "\n");
			console.log("Exec adb -> fb0: " + diffMs(timer));timer = process.hrtime();
			var imageData = Array.apply(null, new Array(dims[1])); //new Array(dims[1]);
			imageData.forEach(function(element, y, array) {
				array[y] = Array.apply(null, new Array(dims[0]));//new Array(dims[0]);
				array[y].forEach(function(element, x, array) {
					var offs = x + y * dims[0];
					array[x] = new mech_png.Pixel(stdout.charCodeAt(offs*4+2), stdout.charCodeAt(offs*4+1),stdout.charCodeAt(offs*4+0));
				});
			});
			//console.log( "imageData[0].constructor == Array -> " + (imageData[0].constructor == Array));
			//console.log("Raw Length: " + stdout.length);
			//console.log("Ascii Data: " + stdout.replace(/[^ -~\n]/g, ""));
			var image = new mech_png.Bitmap(imageData).build(function(err, payload) {
				var png = new mech_png(dims[0], dims[1]).addChunk('IDAT', payload).build();
				res.send(png);
			});
			console.log("Exec fb0->PNG: " + diffMs(timer));timer = process.hrtime();
		});

	//});
});

app.get('/android/ps', function(req, res) {
	var ps = child_process.exec(adb_path + " shell ps -t -x -P -p", function (error, stdout, stderr) {
		var resp = {};
		resp.error = stderr;
		resp.ps = [];
		resp.org = stdout;
		//http://codeseekah.com/2012/10/21/android-shell-tricks-ps/
		stdout = stdout.replace(/\r?\r\n/g, "\n");
		stdout = stdout.replace(/^.*\n+/, "");
		resp.org_after = stdout;
		stdout.split('\n').forEach(function(entry) {
			if(entry.trim().length <= 0) return ;
			var obj={};
			obj.user = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.pid = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.parent_pid = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.vsize = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.rss = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.priority = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.nice = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.realtime_priority = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.schedule = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.pcy = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.wchan = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.pc = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			obj.type = entry.match(/^[^ ]*/)[0]; entry = entry.replace(/^[^ ]* */, "");
			var temp = entry.match(/\([^(]*$/)[0]; entry = entry.replace(/ *\([^(]*$/, "");
			obj.user_time = temp.match(/u:[0-9]+/)[0].replace("u:", "");
			obj.system_time = temp.match(/s:[0-9]+/)[0].replace("s:", "");
			obj.name = entry;
			resp.ps.push(obj);
		});
		res.send(resp);
	});
});


var parseLogcat = function(data, _class) {
	data.toString().split('\n').forEach(function(line) {
		if(line != '') {
			var type = ['info'];
			if(state.hasOwnProperty(_class)) {
				type.push(_class);
			} else {
				Object.keys(state).forEach(function(k) {
					if(util.isArray(state[k])) {
						state[k].forEach(function(rx) {
							var r = new RegExp(rx);
							if(r.test(line)) {
								type.push(k);
							}
						});
					}
				});
			}
			
			if(type.indexOf('error') >= 0) {
				//console.log(line.red.bold);
				app.io.broadcast('line', {'line': line, 'type': 'error'});
			} else if(type.indexOf('warning') >= 0) {
				//console.log(line.yellow.bold);
				app.io.broadcast('line', {'line': line, 'type': 'warning'});
			} else if(type.indexOf('success') >= 0) {
				//console.log(line.green.bold);
				app.io.broadcast('line', {'line': line, 'type': 'success'});
			} else {
				//console.log(line.blue.bold);
				app.io.broadcast('line', {'line': line, 'type': type[0]});
			}
		}
	});
};
var lastDevice="";
var lineBuff="";
var parseEventCapture = function(data, _class) {

	var inputData = data.toString().replace(/\r\n/g, "\n");//.replace(/\n[ \t]+/, " ");
	//Try to get global event info
	
//	inputGlob = JSON.parse("["+ 
//		inputData.replace(/\/.*\n/g, "")
//			.replace(/\n[ \t]+name: */g, ":")
//			.replace(/add device [0-9]+: /g, "{\"")
//			.replace(/could not.*\n/g, "")
//			.replace(/\n/g, "},")
//			.replace(/}?,?$/, "}")
//			+"]");
//	for(var i in inputGlob) {
//		globalEventInfo[i] = inputGlob[i];
//	}
	lineBuff += inputData;
	if(!lineBuff.match(/\n/)) return;
	inputData = lineBuff.replace(/[^\n]*$/, "");
	lineBuff = lineBuff.replace(/([^\n]*\n)*/,"");
	inputData.split(/\n/).forEach(function(line) {
		if(line.trim().length <= 0) return;
		if(line[0] == ' ') {
			globalEventInfo[parseEventCapture.lastDevice] = line.replace(/ *name: */, " ").replace(/"/g, "").trim();
		} else if(line[0] == '/') {
			var list = line.trim().split(/:? +/);

			app.io.broadcast('EventCapture', {
				"file": list[0],
				"cmd": parseInt(list[1], 16),
				"id": parseInt(list[2], 16),
				"value": parseInt(list[3], 16),
				"raw": line
			});	
		} else if(line.match(/add device/)) {
			parseEventCapture.lastDevice = line.replace(/add device [0-9]+: */, "").replace(/"/g, "").trim();
			console.log("Adding Device: " + parseEventCapture.lastDevice);
		} else if(line.match(/could not/)) {
			var inputGlob = line.replace(/^[^\/]+/, "").replace(/,[^,]*/, "");
			globalEventInfo[inputGlob] = "";
		} else {
			console.log("Unknown EventCapture data: \"" + line+"\"");
		}
		
		
		
	});
};
parseEventCapture.device = "";

logcat.stdout.on('data', function(data){parseLogcat(data);});

logcat.stderr.on('data', function(data){parseLogcat(data, 'error');});

logcat.on('exit', function (code) {
	console.log("Reconnecting Logcat");
	logcat = spawn(adb_path, ['logcat']);
});


event_capture.stdout.on('data', function(data){parseEventCapture(data);});

event_capture.stderr.on('data', function(data){parseEventCapture(data, 'error');});

event_capture.on('exit', function (code) {
	console.log("Reconnecting Event Capture");
	event_capture = spawn(adb_path, ['shell', 'getevent']);
});
module.exports = app;
app.listen(8080);
