var dnode = require('dnode'),
  Client = require('./client');

var Server = function(port) {
  this.clients = [];
  this.port = port || 5004;
};

Server.prototype.run = function () {
  var self = this;

  this.dnode_server = dnode({
    testRepo: function (repo, branch, cb) {
      console.log('Received repo test: ' + repo);
      var cl = self.findBestClient();
      cl.running++;
      cl.remote.testRepo(repo, branch, function (result) {
        cl.running--;
        cb(result);
      });
    },

    testModule: function (module, repository, cb) {
      console.log('Received module test: ' + module);
      var cl = self.findBestClient();
      cl.running++;
      cl.remote.testModule(module, repository, function (result) {
        cl.running--;
        cb(result);
      });
    },

    addMe: function (ip, port, cb) {
      var cl = new Client(ip, port);
      cl.init(function() {
        self.clients.push(cl);
        console.log('Node ' + ip  + ':' + port + ' loaded!');
        cb();
      });
    }
  });

  this.dnode_server.listen(this.port);
  console.log('Work balancer started!');
};

Server.prototype.findBestClient = function() {
  var aux = this.clients[0] || undefined;
  for (var i = this.clients.length - 1; i >= 0; i--) {
    if(this.clients[i].running < aux.running) {
      aux = this.clients[i];
    }
  }
  return aux;
};

module.exports = Server;