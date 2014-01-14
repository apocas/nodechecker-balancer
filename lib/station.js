require('colors');

var net           = require('net'),
  events = require('events'),
  sys = require('sys'),
  DuplexEmitter = require('duplex-emitter');


var Station = function(port) {
  var self = this;

  this.port = port;
  this.server = net.createServer(onConnection);
  this.workers = [];

  function onConnection(socket) {
    console.log('Worker connected!'.green);
    self.socket = socket;
    self.remote = DuplexEmitter(socket);
    var worker = {'remote': self.remote, 'socket': self.socket};

    self.workers.push(worker);

    socket.once('end', onEnd);
    socket.on('error', onEnd);

    function onEnd() {
      console.log('Worker disconnected!'.red);
      var i = self.workers.indexOf(worker);
      if (i >= 0) {
        self.workers.splice(i, 1);
        console.log('Worker removed!'.yellow);
      }
    }

    self.emit('workerConnected', worker);
  }
};

sys.inherits(Station, events.EventEmitter);


Station.prototype.start = function() {
  this.server.listen(this.port, function() {
    console.log('Station listening!');
  });
};


module.exports = Station;
