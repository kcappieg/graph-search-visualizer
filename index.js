//spin up thrift server
const thriftServer = require('./thrift_server/server');

//spin up file server
const express = require('express');
const app = express();

app.use(express.static('public'));

let port = 80;

if (process.env.MODE != 'PRODUCTION') port = 3000

// const appServer = app.listen(port, () => console.log(`Listening on port ${port}`));

process.on('SIGINT', () => {
  thriftServer.close();
  // appServer.close();
})