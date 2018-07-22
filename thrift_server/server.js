const thrift = require('thrift');
const BrokerSvc = require('./gen-nodejs/Broker.js');
const brokerHandler = require('./broker_handler.js');

const BINARY_PROTOCOL_PORT = 8080;

const svcOptions = {
  transport: thrift.TBufferedTransport,
  protocol: thrift.TJSONProtocol,
  processor: BrokerSvc,
  handler: brokerHandler
};

const webServerOptions = {
  files: './public',
  services: {
    '/broker': svcOptions
  }
};

module.exports = function createServer(webPort) {
  //web server
  const webServer = thrift.createWebServer(webServerOptions);
  webServer.listen(webPort);

  //binaryProtocol Server
  const server = thrift.createServer(BrokerSvc, brokerHandler);
  server.listen(BINARY_PROTOCOL_PORT);

  console.log(`HTTP Thrift Server listening on port ${webPort}`);
  console.log(`Binary protocol Thrift Server listening on port ${BINARY_PROTOCOL_PORT}`);

  return {webServer, webPort, server, serverPort: BINARY_PROTOCOL_PORT};
};