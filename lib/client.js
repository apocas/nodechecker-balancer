var dnode = require('dnode');

var Client = function(address, port) {
  this.running = 0;

  this.address = address;
  this.port = port;
  this.connected = false;

  this.client_dnode = dnode.connect(port, address);
};

Client.prototype.init = function(cb) {
  var self = this;

  this.client_dnode.on('remote', function (remote) {
    console.log('Connected to node!');
    this.connected = true;
    self.remote = remote;
    if(cb) cb();
  });

  d.on('end', function() {
    this.connected = false;
    console.log('Node ' + self.address + ' disconnected!');
  });

  d.on('fail', function() {
    //this.connected = false;
    console.log('Node ' + self.address + ' failure detected!');
  });
};

Client.prototype.end = function() {
  this.client_dnode.end();
};

module.exports = Client;