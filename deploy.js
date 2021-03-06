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
    var port = '';
    var links = [];
    if (config.images && config.images[argv._[1]]) {
      if (config.images[argv._[1]].port) {
        port = config.images[argv._[1]].port;
      }
      if (config.images[argv._[1]].links) {
        links = config.images[argv._[1]].links;
      }
    }
    request.post(config.server+'/deploy/'+argv._[1], {
      form: {
        baseUrl: config.registry,
        image: argv._[1],
        port: port,
        links: links
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
    if (argv._[1]) {
      config.server = argv._[1];
      fs.writeFileSync(path.resolve(process.env.HOME, '.deploycfg'), JSON.stringify(config));
      console.log('Server url saved');
    }
    break;
  case 'docker-registry':
    if (argv._[1]) {
      config.registry = argv._[1];
      fs.writeFileSync(path.resolve(process.env.HOME, '.deploycfg'), JSON.stringify(config));
      console.log('Private docker registry url saved');
    }
    break;
  case 'config':
    if (argv._[1]) {
      config.images = config.images || {};
      config.images[argv._[1]] = config.images[argv._[1]] || {};
      config.images[argv._[1]].port = argv.p || '';
      config.images[argv._[1]].links = (argv.links && argv.links.split(',')) || [];
      fs.writeFileSync(path.resolve(process.env.HOME, '.deploycfg'), JSON.stringify(config));
    }
    break;
  default:
    console.log([
      'Usage: node deploy.js COMMAND ARGS',
      '',
      ' Available commands:',
      '   deploy DOCKER_IMAGE           deploys a docker image to the configured server',
      '   undeploy DOCKER_IMAGE         undeploys a docker image to the configured server',
      '   list                          lists all docker images currently deployed',
      '   server URL                    sets the url as the server for deploying',
      '   docker-registry URL           sets the docker registry base url',
      '   config DOCKER_IMAGE -p PORT   exposes PORT when image is deployed',
      ''
    ].join('\n'));
}
