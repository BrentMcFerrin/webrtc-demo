var io = require('socket.io-client');
var Socketiop2p = require('socket.io-p2p');

function init () {
  var socket = io('http://localhost:3030');
  var opts = { peerOpts: { trickle: false }, autoUpgrade: false, numClients: 2 }
  var p2psocket = new Socketiop2p(socket, opts, function () {
    privateButton.disabled = false
    console.log('Hello there. I am ' + p2psocket.peerId);
    p2psocket.emit('peer-obj', 'Hello there. I am ' + p2psocket.peerId)
  })

  // Elements
  var privateButton = document.getElementById('private')
  var form = document.getElementById('msg-form')
  var box = document.getElementById('msg-box')
  var boxFile = document.getElementById('msg-file')
  var msgList = document.getElementById('msg-list')
  var upgradeMsg = document.getElementById('upgrade-msg')

  p2psocket.on('peer-msg', function (data) {
    var li = document.createElement('li')
    li.appendChild(document.createTextNode(data.textVal))
    msgList.appendChild(li)
  })

  p2psocket.on('peer-file', function (data) {
    var li = document.createElement('li')
    var fileBytes = new Uint8Array(data.file)
    var blob = new window.Blob([fileBytes], {type: 'image/jpeg'})
    var urlCreator = window.URL || window.webkitURL
    var fileUrl = urlCreator.createObjectURL(blob)
    var a = document.createElement('a')
    var linkText = document.createTextNode('New file')
    a.href = fileUrl
    a.appendChild(linkText)
    li.appendChild(a)
    msgList.appendChild(li)
  })

  form.addEventListener('submit', function (e, d) {
    e.preventDefault()
    var li = document.createElement('li')
    li.appendChild(document.createTextNode(box.value))
    msgList.appendChild(li)
    if (boxFile.value !== '') {
      var reader = new window.FileReader()
      reader.onload = function (evnt) {
        p2psocket.emit('peer-file', {file: evnt.target.result})
      }
      reader.onerror = function (err) {
        console.error('Error while reading file', err)
      }
      reader.readAsArrayBuffer(boxFile.files[0])
    } else {
      p2psocket.emit('peer-msg', {textVal: box.value})
    }
    box.value = ''
    boxFile.value = ''
  })

  privateButton.addEventListener('click', function (e) {
    goPrivate();
    console.log('going private...');
    p2psocket.emit('go-private', true)
  })

  p2psocket.on('go-private', function () {
    console.log('peer wants to go private...');
    goPrivate();
  })

  function goPrivate () {
    p2psocket.useSockets = false;
    upgradeMsg.innerHTML = 'WebRTC connection established!';
    privateButton.disabled = true;
    p2psocket.upgrade();
  }
}

document.addEventListener('DOMContentLoaded', init, false)