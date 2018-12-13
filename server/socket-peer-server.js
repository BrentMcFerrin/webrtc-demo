// var _ = require('lodash');
var http = require('http');
var browserify = require('browserify-middleware');
var debug = require('debug')('server');
var express = require('express');
var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);

var DEFAULT_PEER_COUNT = 5;
app.use(express.static(__dirname));
app.get('/js/bundle.js', browserify(['debug', 'lodash', 'socket.io-client', 'simple-peer', {'./client.js': {run: true}}]));
// app.get('/js/bundle.js', browserify(['debug', 'lodash', 'socket.io-client', 'simple-peer', {'../client/src/peerTest/simplePeerTest.js': {run: true}}]));

io.on('connection', function (socket) {
  console.log('Connection with ID:', socket.id);

  socket.on('go-private', function(data) {
    console.log('going private...');
    var peersToAdvertise = Object.keys(io.sockets.connected);
    var index = peersToAdvertise.indexOf(socket.id);
    if (index > -1) {
      peersToAdvertise.splice(index, 1);
    }

    console.log('advertising peers', peersToAdvertise);

    if (peersToAdvertise) {
      peersToAdvertise.forEach(function(socket2id) {
        var socket2 = io.sockets.connected[socket2id];
        console.log('Advertising peer %s to %s', socket.id, socket2.id);
        socket2.emit('peer', {
          peerId: socket.id,
          initiator: true
        });
        socket.emit('peer', {
          peerId: socket2.id,
          initiator: false
        });
      });
    }
  });  

  socket.on('signal', function(data) {
    var socket2 = io.sockets.connected[data.peerId];
    if (!socket2) { return; }
    console.log('Proxying signal from peer %s to %s', socket.id, socket2.id);

    socket2.emit('signal', {
      signal: data.signal,
      peerId: socket.id
    });
  });
});

server.listen(process.env.PORT || '3030');
console.log('Server Listening on PORT 3030');
