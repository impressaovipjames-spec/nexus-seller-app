const http = require('http');

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('OK - SISTEMA ISOLADO FUNCIONANDO');
}).listen(8080, '0.0.0.0', () => {
  console.log('TEST SERVER ON - PORT 8080');
});
