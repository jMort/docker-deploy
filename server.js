var bodyParser = require('body-parser'),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    express = require('express');

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/health', function (req, res) {
  res.status(200);
  res.end();
});

app.post('/deploy/:name', function (req, res) {
  var image = req.body.baseUrl + '/' + req.body.image + (req.body.tag ? req.body.tag : '');
  var pull = spawn('docker', ['pull', image]);
  var intervalId = setInterval(function () {
    res.write('. ');
  }, 100);
  pull.stdout.on('data', function (data) {
    console.log(data.toString().trim());
  });
  pull.stdout.on('end', function () {
    console.log('FINISHED PULLING');
    var stop = spawn('docker', ['rm', '-f', req.params.name]);
    stop.stdout.on('data', function (data) {
      console.log(data.toString().trim());
    });
    stop.stdout.on('end', function () {
      console.log('FINISHED STOPPING');
      var run = spawn('docker', ['run', '-d', '--name', req.params.name, image]);
      run.stdout.on('data', function (data) {
        console.log(data.toString().trim());
      });
      run.stdout.on('end', function () {
        console.log(image, 'is now running');
        clearInterval(intervalId);
        res.write('\n' + image + ' is now running\n');
        res.end();
      });
    });
  });
});

app.post('/undeploy/:name', function (req, res) {
  var stop = spawn('docker', ['rm', '-f', req.params.name]);
  stop.stdout.on('end', function () {
    res.send('Undeployed ' + req.params.name + '\n');
    res.end();
  });
});

app.get('/list', function (req, res) {
  exec([
    'docker',
    'ps'
  ].join(' '), function (err, stdout, stderr) {
    var lines = stdout.trim().split('\n');
    var index = lines[0].indexOf('CREATED');
    lines = lines.splice(1);
    res.send(lines.map(function (i) {
      var created = i.substr(index, i.indexOf('ago')+3-index);
      var name = i.trim().match('.* (.*?)$')[1];
      return name + ' ('+created+')';
    }).join('\n')+'\n');
  });
});

app.listen(3333);
