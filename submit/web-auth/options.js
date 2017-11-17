#!/usr/bin/env nodejs

'use strict';

const assert = require('assert');
const path = require('path');
const process = require('process');

const minimist = require('minimist');

const OPTS = [
  ['d', 'ssl-dir' ]
];

const DEFAULT_SSL_DIR = '.';

function usage(prg) {
  const opts = OPTS.map(function(opt) {
    const value = opt[1].replace('-', '_').toUpperCase();
    return `[ -${opt[0]}|--${opt[1]} ${value} ]`
  });
  console.error(`usage: ${path.basename(prg)} ${opts.join(' ')} PORT WS_URL`);
  process.exit(1);
}

function getOptions(argv) { 
  // console.log('argv is ',argv);
  const opts0 = OPTS.reduce((a, b) => a.concat(b), []);
  const opts = minimist(argv.slice(2));
  if (opts._.length !== 2) usage(argv[1]);
  // opts._[1] match url using regex
  const reg = new RegExp('^(https?:\/\/)?([a-z\.\d]+)\.([a-z]{2,6})[\/\w \.-]*\/?$');
  if(!reg.test(opts._[1])){
    usage(argv[1]);
  }
  for (let k of Object.keys(opts)) {
    if (k === '_') continue;
    if (opts0.indexOf(k) < 0) {
      console.error(`bad option '${k}'`);
      usage(argv[1]);
    }
  }
  return {
    port: opts._[0],
    ws_url:opts._[1],
    sslDir: opts.d || opts['ssl-dir'] || DEFAULT_SSL_DIR
  };
}

module.exports = {
  options: getOptions(process.argv)
};

if (!module.parent) {
  console.log(getOptions(process.argv));
}


