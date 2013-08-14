var dnode = require('dnode');

var Client = function(address, port) {
  this.running = 0;

  this.address = address;
  this.port = port;

  this.client_dnode = dnode.connect(port, address);
};

Client.prototype.init = function(cb) {
  var self = this;

  this.client_dnode.on('remote', function (remote) {
    console.log('Connected to node');
    self.remote = remote;
    if(cb) cb();
  });
};

module.exports = Client;