#!/usr/bin/env node
/* A static file server for local preview.
 *
 *   npm start
 *
 * Opening index.html straight from the filesystem mostly works, but the
 * Copy button does not: the clipboard API is only available on a secure
 * origin, and file:// is not one. localhost is, so use this to test copying.
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8000;

const TYPES = {
  '.html':'text/html; charset=utf-8',
  '.css' :'text/css; charset=utf-8',
  '.js'  :'text/javascript; charset=utf-8',
  '.md'  :'text/markdown; charset=utf-8',
  '.svg' :'image/svg+xml',
  '.png' :'image/png',
  '.ico' :'image/x-icon',
};

const server = http.createServer((req, res) => {
  // A malformed request must not take the server down with it.
  let requested;
  try{
    requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  }catch{
    res.writeHead(400, {'Content-Type':'text/plain; charset=utf-8'}).end('Bad request');
    return;
  }

  const relative = requested.endsWith('/') ? `${requested}index.html` : requested;

  // Resolve inside ROOT only, so a crafted path cannot escape the project.
  const file = path.join(ROOT, relative);
  if(!file.startsWith(ROOT + path.sep)){
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(file, (err, body) => {
    if(err){
      res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}).end('Not found');
      return;
    }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream'});
    res.end(body);
  });
});

server.listen(PORT, () => {
  console.log(`ClearJD is running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop.');
});
