#!/usr/local/bin/node

var fs = require('fs'),
    path = require('path'),
    request = require('request');

var argv = require('minimist')(process.argv.slice(2));

var config = {};
try {
  config = JSON.parse(fs.readFileSync(path.resolve(process.env.HOME, '.deploycfg')));
} catch (err) {
}

switch (argv._[0]) {
  case 'deploy':
    if (!argv._[1]) break;
    request.post(config.server+'/deploy/'+argv._[1], {
      form: {
        baseUrl: config.registry,
        image: argv._[1]
      }
    }).pipe(process.stdout);
    break;
  case 'undeploy':
    if (!argv._[1]) break;
    request.post(config.server+'/undeploy/'+argv._[1]).pipe(process.stdout);
    break;
  case 'list':
    request.get(config.server+'/list').pipe(process.stdout);
    break;
  case 'server':
    console.log('server');
    if (argv._[1]) {
      config.server = argv._[1];
    }
    fs.writeFileSync(path.resolve(process.env.HOME, '.deploycfg'), JSON.stringify(config));
    break;
  case 'docker-registry':
    console.log('docker-registry');
    if (argv._[1]) {
      config.registry = argv._[1];
    }
    fs.writeFileSync(path.resolve(process.env.HOME, '.deploycfg'), JSON.stringify(config));
    break;
  default:
    console.log([
      'Usage: node deploy.js COMMAND ARGS',
      '',
      ' Available commands:',
      '   deploy DOCKER_IMAGE     deploys a docker image to the configured server',
      '   undeploy DOCKER_IMAGE   undeploys a docker image to the configured server',
      '   list                    lists all docker images currently deployed',
      '   server URL              sets the url as the server for deploying',
      '   docker-registry URL     sets the docker registry base url',
      ''
    ].join('\n'));
}
