#!/usr/bin/env node --harmony-generators

"use strict";

var co = require('co');
var pingURL = 'http://api.backoffice.alphavisa.com/v1/ping';
var connectivity = require('./').create(pingURL);

// co(function *() {
//   console.log(yield connectivity.ping());
// }).call(this);

connectivity.on('didChange', function(isOnline) {
  console.log(new Date(), isOnline);
});

connectivity.monitor();
