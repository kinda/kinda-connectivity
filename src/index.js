'use strict';

let _ = require('lodash');
let co = require('co');
let wait = require('co-wait');
let KindaObject = require('kinda-object');
let KindaEventManager = require('kinda-event-manager');
let httpClient = require('kinda-http-client').create();

let KindaConnectivity = KindaObject.extend('KindaConnectivity', function() {
  this.include(KindaEventManager);

  this.creator = function(options = {}) {
    if (!options.url) throw new Error('ping url is missing');
    this.url = options.url;
  };

  Object.defineProperty(this, 'isOnline', {
    get() {
      return this._isOnline;
    },
    set(isOnline) {
      if (this._isOnline !== isOnline) {
        this._isOnline = isOnline;
        this.emit('didChange', isOnline);
      }
    }
  });

  Object.defineProperty(this, 'isOffline', {
    get() {
      return this._isOnline != null ? !this._isOnline : undefined;
    }
  });

  this.monitor = function() {
    if (this.isMonitoring) return;

    if (process.browser) {
      window.addEventListener('online', this.ping.bind(this));
      window.addEventListener('offline', this.ping.bind(this));
    }

    co(function *() {
      while (true) {
        let isOnline = yield this.ping();
        yield wait(isOnline ? 30000 : 5000);
      }
    }.bind(this)).catch(function(err) {
      console.error(err.stack || err);
    });

    this.isMonitoring = true;
  };

  this.ping = function *() {
    let isOnline;
    if (process.browser && !navigator.onLine) {
      isOnline = false;
    } else {
      try {
        let result = yield httpClient.get({
          url: this.url,
          timeout: 10000
        });
        isOnline = result.statusCode === 200;
      } catch (err) {
        isOnline = false;
      }
    }
    this.isOnline = isOnline;
    return isOnline;
  };
});

KindaConnectivity.create = _.memoize(KindaConnectivity.create, function(options = {}) {
  return options.url;
});

module.exports = KindaConnectivity;
