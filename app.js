'use strict';

var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var path = require('path');

var app = express();
var config = require('./config.json');
var gameConfig = require('./modules/public/gameConfig.json');
var util = require('./modules/public/util.js');

app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app);
var port = process.env.PORT || config.port;

server.listen(port, function(){
  console.log('Server is Running');
});

var GameManager = require('./modules/server/GameManager.js');
var GM = new GameManager();
GM.start();

var User = require('./modules/server/User.js');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

var io = socketio.listen(server);

io.on('connection', function(socket){
  console.log('user connect : ' + socket.id);

  var user = new User(socket.id);
  var updateUserInterval = false;

  socket.on('reqStartGame', function(){

    // user init and join game
    GM.initializeUser(user);
    GM.joinUser(user);

    //update user data
    if(!updateUserInterval){
      updateUserInterval = setInterval(function(){ GM.updateUser(user); }, INTERVAL_TIMER);
    }

    var userData = GM.updateDataSetting(user);
    //send users user joined game
    socket.broadcast.emit('userJoined', userData);

    var userDatas = GM.updateDataSettings();
    console.log(userDatas);

    socket.emit('setSyncUser', userData);
    socket.emit('resStartGame', userDatas);
  });

  socket.on('reqMove', function(targetPosition, localOffset){
    // var newTargetPosition = util.localToWorldPosition(targetPosition, localOffset);
    GM.setUserTargetAndMove(user, targetPosition);

    var data = GM.updateDataSetting(user);
    io.sockets.emit('resMove', data);
  })

  socket.on('disconnect', function(){
    if(user.constructor === User){
      GM.stopUser(user);
      GM.kickUser(user);
      user = null;
      io.sockets.emit('userLeave', userData.objectID);
    }
    if(updateUserInterval){
      clearInterval(updateUserInterval);
      updateUserInterval = false;
    }
    console.log('user disconnect :' + socket.id);
  });
});
//
// //server util functions
// function setCanvasScale(windowSize, canvasMaxSize){
//   if(windowSize.width >= canvasMaxLocalSize.width || windowSize.height >= canvasMaxLocalSize.height){
//     var scaleFactor = (windowSize.width / canvasMaxLocalSize.width) > (windowSize.height / canvasMaxLocalSize.height) ?
//                   (windowSize.width / canvasMaxLocalSize.width) : (windowSize.height / canvasMaxLocalSize.height);
//     // localConfig.canvasSize = {
//     //   width : config.canvasMaxLocalSize.width,
//     //   height : config.canvasMaxLocalSize.height
//     // };
//   }
//   return 1;
// }
