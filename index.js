let port = 80;

if (process.env.NODE_ENV !== 'PRODUCTION') port = 3000

//spin up thrift servers
const thriftServers = require('./thrift_server/server')(port);

process.on('SIGINT', () => {
  thriftServers.webServer.close();
  thriftServers.server.close();

  process.exit();
})