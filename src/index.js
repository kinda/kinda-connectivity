'use strict';

let _ = require('lodash');
let KindaObject = require('kinda-object');
let KindaEventManager = require('kinda-event-manager');
let util = require('kinda-util').create();
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
        try {
          this.emit('didChange', isOnline);
        } catch (err) {
          console.error(err.stack || err);
        }
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

    (async function() {
      this.isMonitoring = true;
      while (true) {
        let isOnline = await this.ping();
        await util.timeout(isOnline ? 30000 : 15000);
      }
    }).call(this).catch(function(err) {
      console.error(err.stack || err);
      this.isMonitoring = false;
    });
  };

  this.ping = async function() {
    let isOnline;
    if (process.browser && !navigator.onLine) {
      isOnline = false;
    } else {
      try {
        let result = await httpClient.get({
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
