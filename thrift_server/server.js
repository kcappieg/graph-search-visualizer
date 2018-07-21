const thrift = require('thrift');
const BrokerSvc = require('./gen-nodejs/Broker.js');
const brokerHandler = require('./broker_handler.js');

const svcOptions = {
  transport: thrift.TBufferedTransport,
  protocol: thrift.TJSONProtocol,
  processor: BrokerSvc,
  handler: brokerHandler
};

const serverOptions = {
  files: './public',
  services: {
    '/broker': svcOptions
  }
};

const server = thrift.createWebServer(serverOptions);
const port = 3000;

server.listen(port);
console.log(`HTTP Thrift Server listening on port ${port}`);

module.exports = server;