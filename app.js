const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var usernames = {};

var rooms = ['GeneralRoom'];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', (socket) => {
    socket.on('adduser', function(username) {
      socket.username = username;
      socket.room = 'GeneralRoom';
      usernames[username] = username;
      socket.join('GeneralRoom');
      socket.emit('updatechat', 'SERVER', 'you have connected to GeneralRoom');
      socket.broadcast.to('GeneralRoom').emit('updatechat', 'SERVER', username + ' has connected to this room');
      socket.emit('updaterooms', rooms, 'GeneralRoom');
    });

    socket.on('disconnect', () => {
      delete usernames[socket.username];
      io.sockets.emit('updateusers', usernames);
      socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
      socket.leave(socket.room);
    });

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
    });

    socket.on('create', function(room) {
      console.log("Entro aca");
        rooms.push(room);
        socket.broadcast.emit('updaterooms', rooms, socket.room);
        socket.emit('updaterooms', rooms, socket.room);
    });

    socket.on('sendchat', function(data) {
        io.sockets["in"](socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('switchRoom', function(newroom) {
        var oldroom;
        oldroom = socket.room;
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom);
        socket.broadcast.to(oldroom).emit('updatechat', 'SERVER', socket.username + ' has left this room');
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    }); 

  });


server.listen(3000, () => {
  console.log('listening on *:3000');
});