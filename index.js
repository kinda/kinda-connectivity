"use strict";

var co = require('co');
var wait = require('co-wait');
var KindaObject = require('kinda-object');
var util = require('kinda-util').create();
var config = require('kinda-config').get('kinda-connectivity');
var httpClient = require('kinda-http-client').create();

var KindaConnectivity = KindaObject.extend('KindaConnectivity', function() {
  this.setCreator(function(pingURL) {
    this.pingURL = pingURL;
  });

  Object.defineProperty(this, 'isOnline', {
    get: function() {
      return this._isOnline;
    },
    set: function(isOnline) {
      if (this._isOnline !== isOnline) {
        this._isOnline = isOnline;
        this.emit('didChange', isOnline);
      }
    }
  });

  Object.defineProperty(this, 'isOffline', {
    get: function() {
      return !this._isOnline;
    }
  });

  this.monitor = function() {
    if (process.browser) {
      window.addEventListener('online', this.ping.bind(this));
      window.addEventListener('offline', this.ping.bind(this));
    }

    co(function *() {
      while (true) {
        var isOnline = yield this.ping();
        if (isOnline)
          yield wait(30000);
        else
          yield wait(5000);
      }
    }.bind(this)).catch(function(err) {
      console.error(err.stack);
    });
  };

  this.ping = function *() {
    var isOnline;
    if (process.browser && !navigator.onLine) {
      isOnline = false;
    } else {
      try {
        var res = yield httpClient.get({
          url: this.pingURL,
          json: false,
          timeout: 10000
        });
        isOnline = res.statusCode === 200;
      } catch (err) {
        isOnline = false;
      }
    }
    this.isOnline = isOnline;
    return isOnline;
  };
});

var originalCreate = KindaConnectivity.create;
KindaConnectivity.create = function(pingURL) {
  if (!pingURL) pingURL = config.pingURL;
  if (!pingURL) throw new Error('pingURL is missing');
  var instances = global.__kindaConnectivityInstances__;
  if (!instances) {
    instances = global.__kindaConnectivityInstances__ = {};
  }
  var instance = instances[pingURL];
  if (!instance) {
    instance = originalCreate.call(this, pingURL);
    instances[pingURL] = instance;
  }
  return instance;
};

module.exports = KindaConnectivity;
