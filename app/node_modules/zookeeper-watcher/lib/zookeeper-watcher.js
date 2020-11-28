/*!
 * zookeeper-watcher - lib/zookeeper-watcher.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var debug = require('debug')('zookeeper-watcher');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var zookeeper = require('node-zookeeper-client');

function ZooKeeperWatcher(options) {
  if (!(this instanceof ZooKeeperWatcher)) {
    return new ZooKeeperWatcher(options);
  }
  EventEmitter.call(this);

  if (options.hosts) {
    var connectionString = [];
    for (var i = 0; i < options.hosts.length; i++) {
      connectionString.push(options.hosts[i]);
    }
    this.connectionString = connectionString.join(',');
    if (options.root) {
      this.connectionString += options.root;
    }
  } else {
    this.connectionString = options.connectionString;
  }

  this._reconnectTimeout = options.reconnectTimeout || 20000; // 20 seconds to reconncet

  this.options = options;
  // this.logger = this.options.logger || console;
  this._watchPaths = [];
  this._newZK();
}
util.inherits(ZooKeeperWatcher, EventEmitter);

ZooKeeperWatcher.prototype._newZK = function () {
  var self = this;
  var zk = zookeeper.createClient(this.connectionString, this.options);
  var handleCloseCalled = false;
  var handleClose = function () {
    // create new zk client only on closing, session_expired and authentication_failed (others are handled by node-zookeeper-client)
    if (handleCloseCalled || !(zk.connectionManager.state == -1 || zk.connectionManager.state == -3 || zk.connectionManager.state == -4)) {
      return;
    }
    handleCloseCalled = true;

    debug('[%s] zk closed, close All: %s, %d ms reconnect', Date(), !!self.__closeAll, self._reconnectTimeout);
    if (self.__closeAll) {
      // Use call ZooKeeperWatcher.close()
      return;
    }
    !zk.__closed && zk.close();
    zk.__closed = true;
    // create new zk client
    setTimeout(self._newZK.bind(self), self._reconnectTimeout);
  };
  zk.once('expired', handleClose);
  zk.once('disconnected', handleClose);

  self.zk = zk;

  zk.once('connected', function () {
    if (self._watchPaths.length > 0) {
      debug('[%s] connected, auto watch %j', Date(), self._watchPaths);
      // watch again
      for (var i = 0; i < self._watchPaths.length; i++) {
        var p = self._watchPaths[i];
        self._watchPath(p);
      }
    }
  });

  zk.on('connected', self.emit.bind(self, 'connected'));
  zk.on('connectedReadOnly', self.emit.bind(self, 'connectedReadOnly'));
  zk.on('disconnected', self.emit.bind(self, 'disconnected'));
  zk.on('expired', self.emit.bind(self, 'expired'));
  zk.on('authenticationFailed', self.emit.bind(self, 'authenticationFailed'));
  zk.connect();
};

ZooKeeperWatcher.prototype.set = function set(path, data, version, callback) {
  if (typeof data === 'string') {
    data = new Buffer(data);
  }
  if (typeof version === 'function') {
    callback = version;
    version = null;
  }
  this.zk.setData(path, data, version, callback);
};
ZooKeeperWatcher.prototype.setData = ZooKeeperWatcher.prototype.set;

ZooKeeperWatcher.prototype.watch = function (path, callback) {
  var watchEvent = 'watch:' + path;
  var first = true;
  var listeners = this.listeners(watchEvent);
  if (listeners && listeners.length > 0) {
    first = false;
  }

  this.on(watchEvent, callback);

  if (!first) {
    return;
  }

  this._watchPaths.push(path);
  this._watchPath(path);
};

ZooKeeperWatcher.prototype._watchPath = function (path) {
  var watchEvent = 'watch:' + path;
  var self = this;
  var start = function () {
    self.get(path, function (watch) {
      start();
    }, self.emit.bind(self, watchEvent));
  };
  start();
};

ZooKeeperWatcher.prototype.unWatch = function (path) {
  this.removeAllListeners('watch:' + path);
  var needs = [];
  for (var i = 0; i < this._watchPaths.length; i++) {
    var p = this._watchPaths[i];
    if (p !== path) {
      needs.push(p);
    }
  }
  this._watchPaths = needs;
};

ZooKeeperWatcher.prototype.close = function (callback) {
  if (callback) {
    this.zk.once('disconnected', callback);
  }
  this.__closeAll = true;
  this.zk.close();
};

var methods = [
  'create', 'mkdirp', 'remove', 'exists', 'getChildren',
  'getData', 'getACL', 'setACL', 'transaction',
  'addAuthInfo', 'getState', 'getSessionId', 'getSessionPassword',
  'getSessionTimeout',
];

methods.forEach(function (method) {
  ZooKeeperWatcher.prototype[method] = function () {
    return this.zk[method].apply(this.zk, Array.prototype.slice.call(arguments));
  };
  // ZooKeeperWatcher.prototype[method].name = method;
});

ZooKeeperWatcher.prototype.get = ZooKeeperWatcher.prototype.getData;


module.exports = ZooKeeperWatcher;
