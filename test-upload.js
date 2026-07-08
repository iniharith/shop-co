const http = require('http');

const data = JSON.stringify({
  files: [{
    fileUrl: "http://example.com/test.jpg",
    key: "test.jpg",
    name: "test.jpg",
    type: "image/jpeg",
    size: 1234
  }]
});

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/files/save-metadata',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
