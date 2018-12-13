var Peer = require('simple-peer');
var io = require('socket.io-client');
var debug = require('debug')('client');
var socket = io.connect();
var peers = {};
var useTrickle = true;

var me = null;

// Elements
var privateButton = document.getElementById('private')
var form = document.getElementById('msg-form')
var box = document.getElementById('msg-box')
var boxFile = document.getElementById('msg-file')
var msgList = document.getElementById('msg-list')
var upgradeMsg = document.getElementById('upgrade-msg')

socket.on('connect', function() {
  console.log('Connected to signalling server, Peer ID: %s', socket.id);
  privateButton.disabled = false;
});

socket.on('peer', function(data) { // go private
  var peerId = data.peerId;
  // var peer = new Peer({ initiator: data.initiator, trickle: useTrickle });
  var peer = new Peer({ initiator: location.hash === '#1', trickle: useTrickle });

  console.log('Peer available for connection discovered from signalling server, Peer ID: %s', peerId);

  socket.on('signal', function(data) {
    if (data.peerId == peerId) {
      console.log('Received signalling data', data, 'from Peer ID:', peerId);
      peer.signal(data.signal);
    }
  });

  peer.on('signal', function(data) {
    console.log('Advertising signalling data', data, 'to Peer ID:', peerId);
    socket.emit('signal', {
      signal: data,
      peerId: peerId
    });
  });
  peer.on('error', function(e) {
    console.log('Error sending connection to peer %s:', peerId, e);
  });
  peer.on('connect', function() {
    console.log('Peer connection established');
    if(location.hash === '#1') {
      peer.send("hi, bitch");
    } else {
      peer.send("hello, my lord");
    }
  });
  peer.on('data', function(data) {
    var string = new TextDecoder("utf-8").decode(data);
    console.log('Recieved data from peer:', string);
    var li = document.createElement('li')
    li.appendChild(document.createTextNode(string))
    msgList.appendChild(li)
  });
  peers[peerId] = peer;
  me = peer;
});

form.addEventListener('submit', function (e, d) {
  e.preventDefault()
  var li = document.createElement('li')
  li.appendChild(document.createTextNode(box.value))
  msgList.appendChild(li)
  if (boxFile && boxFile.value !== '') {
    var reader = new window.FileReader()
    reader.onload = function (evnt) {
      socket.emit('peer-file', {file: evnt.target.result})
    }
    reader.onerror = function (err) {
      console.error('Error while reading file', err)
    }
    reader.readAsArrayBuffer(boxFile.files[0])
  } else {
    if (me) {
      me.send(box.value);
    } else {
      socket.emit('peer-msg', {textVal: box.value});
    }    
  }
  box.value = ''
  boxFile.value = ''
});

privateButton.addEventListener('click', function (e) {
  goPrivate();
  console.log('going private...');
  socket.emit('go-private', true)
});

function goPrivate () {
  upgradeMsg.innerHTML = 'WebRTC connection established!';
  privateButton.disabled = true;
}
