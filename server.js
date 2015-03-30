var bodyParser = require('body-parser'),
    colors = require('colors'),
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
  var portMapping = (req.body.port && req.body.port+':'+req.body.port) || '';
  var pull = spawn('docker', ['pull', image]);
  var error = '';
  var intervalId = setInterval(function () {
    res.write('. ');
  }, 100);
  pull.stdout.on('data', function (data) {
    console.log(data.toString().trim());
  });
  pull.stderr.on('data', function (data) {
    data = data.toString().trim();
    console.log(data);
    var matches = data.match('msg="(.*?)"');
    if (matches && matches[1]) {
      error += matches[1] + '\n';
    }
  });
  pull.stdout.on('end', function () {
    if (error) {
      clearInterval(intervalId);
      res.write(error.red);
      return res.end();
    }
    console.log('FINISHED PULLING');
    var stop = spawn('docker', ['rm', '-f', req.params.name]);
    stop.stdout.on('data', function (data) {
      console.log(data.toString().trim());
    });
    stop.stdout.on('end', function () {
      console.log('FINISHED STOPPING');
      error = '';
      var run = spawn('docker', ['run', '-d', '-p', portMapping, '--name', req.params.name, image]);
      run.stdout.on('data', function (data) {
        console.log(data.toString().trim());
      });
      run.stderr.on('data', function (data) {
        data = data.toString().trim();
        console.log(data);
        var matches = data.match('msg="(.*?)"');
        if (matches && matches[1]) {
          error += matches[1] + '\n';
        }
      });
      run.stdout.on('end', function () {
        if (error) {
          clearInterval(intervalId);
          res.write(error.red);
          return res.end();
        }
        console.log(image, 'is now running');
        clearInterval(intervalId);
        image = req.body.baseUrl + '/' + req.body.image.bold +
                ':' + (req.body.tag ? req.body.tag : 'latest');
        if (req.body.port) {
          console.log('Port', req.body.port, 'exposed');
          res.write('\nPort '+req.body.port+' exposed\n');
        } else {
          console.log('No ports exposed');
          res.write('\nNo ports exposed\n');
        }
        var str = image + ' is now running\n';
        res.write(str.green);
        res.end();
      });
    });
  });
});

app.post('/undeploy/:name', function (req, res) {
  var stop = spawn('docker', ['rm', '-f', req.params.name]);
  stop.stdout.on('end', function () {
    var str = 'Undeployed ' + req.params.name + '\n';
    res.send(str.bold.yellow);
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
      var created = '('+i.substr(index, i.indexOf('ago')+3-index)+')';
      var name = i.trim().match('.* (.*?)$')[1].bold.blue;
      return name + ' ' + created.yellow;
    }).join('\n')+'\n');
  });
});

app.listen(3333);
