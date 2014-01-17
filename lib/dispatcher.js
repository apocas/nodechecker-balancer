require('colors');

var net           = require('net'),
  DuplexEmitter = require('duplex-emitter'),
  Station = require('./station');


var Dispatcher = function(port) {
  var self = this;

  this.port = port;
  this.server = net.createServer(onConnection);
  this.station = new Station(5005);
  this.station.start();
  this.producers = [];

  this.station.on('workerConnected', onWorkerConnected);

  function onWorkerConnected(worker) {
    self.consume();
  }

  function onConnection(socket) {
    console.log('Producer connected!'.green);
    var remote = DuplexEmitter(socket);
    var queue = [];

    var producer = {'remote': remote, 'socket': socket, 'queue': queue};
    self.producers.push(producer);

    remote.on('test', function(data) {
      queue.push(data);
      self.consume();
    });

    socket.once('end', onEnd);
    socket.on('error', onEnd);

    function onEnd() {
      console.log('Producer disconnected!'.red);
      var i = self.producers.indexOf(producer);
      if (i >= 0) {
        self.producers.splice(i, 1);
        console.log('Producer removed!'.yellow);
      }
    }
  }
};


Dispatcher.prototype.consume = function() {
  if(this.producers.length > 0) {
    var producer = this.producers[0];
    var worker = this.station.workers.shift();

    if(producer && worker) {
      var job = producer.queue.shift();
      if(job) {
        setTimeout(function() {
          worker.socket.end();
          producer.remote.emit('done', {'job': job, 'result': {'result': 'timedout', 'code': 137, 'output': null}});
        }, process.env.TEST_TIMEOUT || 120000);

        worker.remote.on('done', function(data) {
          producer.remote.emit('done', data);
        });
        worker.remote.emit('test', job);
      } else {
        //producer doesn't have more work, disconnect him
        var i = this.producers.indexOf(producer);
        if(i != -1) this.producers.splice(i, 1);
        producer.socket.end();
        console.log('Producer without work, disconnected.'.red);
        this.consume();
      }
    }
  }
};


Dispatcher.prototype.start = function() {
  this.server.listen(this.port, function() {
    console.log('Dispatcher listening!');
  });
};


module.exports = Dispatcher;
