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
      producer.queue.push(data);
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
  if(this.producers.length > 0 && this.station.workers.length > 0) {
    var producer = this.findProducer();
    var worker = this.station.workers.shift();

    if(producer && worker) {
      var job = producer.queue.shift();
      if(job) {
        console.log('Queue size (dequeued): ' + producer.queue.length);
        console.log('Consuming work.'.green);
        /*
        var timeo = setTimeout(function() {
          console.log('TIMEOUT detected! ' + job);
          worker.socket.end();
          producer.remote.emit('done', {'job': job, 'result': {'result': 'timedout', 'code': 137, 'output': {'stdout': '', 'stderr': ''}}});
        }, process.env.TEST_TIMEOUT || 600000);
        */

        worker.remote.on('done', function(data) {
          //clearTimeout(timeo);
          producer.remote.emit('done', data);
        });
        worker.remote.emit('test', job);
      } else {
        console.log('Producer without work.');
        this.station.workers.push(worker);
      }
    } else {
      this.station.workers.push(worker);
    }
  }
};


Dispatcher.prototype.findProducer = function() {
  for (var i = this.producers.length - 1; i >= 0; i--) {
    if(this.producers[i].queue.length > 0) {
      return this.producers[i];
    }
  }
  return undefined;
};


Dispatcher.prototype.start = function() {
  this.server.listen(this.port, function() {
    console.log('Dispatcher listening!');
  });
};


module.exports = Dispatcher;
