(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var User = require('./CUser.js');
var util = require('../public/util.js');

var CManager = function(gameConfig){
	this.gameConfig = gameConfig;

	//user correspond client
	this.user = null;
	//all users
	this.users = [];
};

CManager.prototype = {
	setUser : function(userData){
		if(!this.checkUserAtUsers(userData)){
			var tempUser = new User(userData, this.gameConfig);
			this.users[userData.objectID] = tempUser;
			this.users[userData.objectID].changeState(userData.currentState);
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas){
		for(var index in userDatas){
			var tempUser = new User(userDatas[index], this.gameConfig);
			this.users[userDatas[index].objectID] = tempUser;
			this.users[userDatas[index].objectID].changeState(userDatas[index].currentState);
		}
	},
	updateUsers : function(){

	},
	checkUserAtUsers : function(userData){
		if(userData.objectID in this.users){
			return true;
		}else{
			return false;
		}
	},
	//will be merge to updateUser function
	moveUser : function(userData){
		if(this.checkUserAtUsers(userData)){
			console.log(userData);
			console.log(this.users[userData.objectID]);
			this.users[userData.objectID].position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
			this.users[userData.objectID].targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);

			// this.users[userData.objectID].speed.x = userData.speed.x;
			// this.users[userData.objectID].speed.y = userData.speed.y;

			this.users[userData.objectID].direction = userData.direction;
			this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
			// this.users[userData.objectID].targetDirection = userData.targetDirection;

			this.users[userData.objectID].setCenter();
			this.users[userData.objectID].setTargetDirection();
			this.users[userData.objectID].setSpeed();

			if(this.user.objectID == userData.objectID){
				//offset targetPosition change >> targetPosition == position
				this.users[userData.objectID].changeState(this.gameConfig.OBJECT_STATE_MOVE_OFFSET);
			}else{
				this.users[userData.objectID].changeState(userData.currentState);
			}
		}else{
  		console.log('can`t find user data');
		}
	},
	//execute every frame this client user move
	moveUsersOffset : function(){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				if(this.users[index] !== this.user){
					this.users[index].position.x -= this.user.speed.x;
					this.users[index].position.y -= this.user.speed.y;

					this.users[index].center.x -= this.user.speed.x;
					this.users[index].center.y -= this.user.speed.y;

					this.users[index].targetPosition.x -= this.user.speed.x;
					this.users[index].targetPosition.y -= this.user.speed.y;
				}
			}else{
				console.log('can`t find user data');
			}
		}
	},
	// set this client user
	synchronizeUser : function(userID){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				this.user = this.users[index];
				this.user.onMoveOffset = this.moveUsersOffset.bind(this);
			}
		}
		if(this.user === null){
			console.log('if print me. Something is wrong');
		}
	},
	findUserAsWorldPosition : function(userID, offset){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				var returnVal = {
					position : util.localToWorldPosition(this.users[index].position, offset),
					size : this.users[index].size
				};
				return returnVal;
			}
		}
	},
	//if canvas size changed re calculate all object local position
	reCalcLocalPosition : function(beforeOffset, afterOffset){
		for(var index in this.users){
			// before local position transform world position[position, targetPosition, center]
			var worldPosition = util.localToWorldPosition(this.users[index].position, beforeOffset);
			var worldTargetPosition = util.localToWorldPosition(this.users[index].targetPosition, beforeOffset);

			this.users[index].position = util.worldToLocalPosition(worldPosition, afterOffset);
			this.users[index].targetPosition = util.worldToLocalPosition(worldTargetPosition, afterOffset);
			this.users[index].setCenter();
		}
	}
};

module.exports = CManager;

},{"../public/util.js":5,"./CUser.js":2}],2:[function(require,module,exports){
var util = require('../public/util.js');

var User = function(userData, gameConfig){
  this.gameConfig = gameConfig;

  this.objectID = userData.objectID;

  this.currentState = null;
  this.size = userData.size;

  this.position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
  this.targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;

  this.maxSpeed = userData.maxSpeed;

  this.center = {x : 0, y : 0};
  this.speed = {x : 0, y : 0};
  this.targetDirection = 0;

  this.setCenter();
  this.setSpeed();
  this.setTargetDirection();

  this.updateInterval = false;
  this.updateFunction = null;

  this.onMoveOffset = null;
};

User.prototype = {
  changeState : function(newState){

    this.currentState = newState;

    this.stop();
    switch (this.currentState) {
      case this.gameConfig.OBJECT_STATE_IDLE:
        this.updateFunction = null;
        break;
      case this.gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate.bind(this);
        break;
      case this.gameConfig.OBJECT_STATE_MOVE_OFFSET:
        this.updateFunction = this.rotate.bind(this);
        break;
    }
    this.update();
  },
  update : function(){
    var INTERVAL_TIMER = 1000/this.gameConfig.INTERVAL;
    this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
  },
  setCenter : function(){
    this.center.x = this.position.x + this.size.width/2,
    this.center.y = this.position.y + this.size.height/2
  },
  rotate : function(){
    util.rotate.call(this);
  },
  move : function(){
    util.move.call(this);
  },
  setTargetDirection : function(){
    util.setTargetDirection.call(this);
  },
  setSpeed : function(){
    util.setSpeed.call(this);
  },
  moveOffset : function(){
    var distX = this.targetPosition.x - this.center.x;
    var distY = this.targetPosition.y - this.center.y;
    console.log(util.localToWorldPosition(this.center, this.gameConfig.userOffset));
    console.log('in moveOffset : ' + distX + ' : ' + distY);

    if(distX == 0 && distY == 0){
      this.stop();
      this.changeState(this.gameConfig.OBJECT_STATE_IDLE);
    }
    if(Math.abs(distX) < Math.abs(this.speed.x)){
      this.speed.x = distX;
    }
    if(Math.abs(distY) < Math.abs(this.speed.y)){
      this.speed.y = distY;
    }
    this.targetPosition.x -= this.speed.x;
    this.targetPosition.y -= this.speed.y;

    this.gameConfig.userOffset.x += this.speed.x;
    this.gameConfig.userOffset.y += this.speed.y;

    this.onMoveOffset();
  },
  stop : function(){
    console.log('stop');
    if(this.updateInterval){
      clearInterval(this.updateInterval);
      this.updateInterval = false;
    }
  }
};

module.exports = User;

},{"../public/util.js":5}],3:[function(require,module,exports){
module.exports={
  "USER_BODY_SRC" : "../images/CharBase.svg",
  "USER_BODY_SIZE" : 64,
  "USER_HAND_SRC" : "../images/CharHand.svg",
  "USER_HAND_SIZE" : 64,
  "GRID_SRC" : "../images/map-grass.png",
  "GRID_SIZE" : 60
}

},{}],4:[function(require,module,exports){
module.exports={
  "INTERVAL" : 30,

  "CANVAS_MAX_SIZE" : {"width" : 11200 , "height" : 11200},
  "CANVAS_MAX_LOCAL_SIZE" : {"width" : 1600, "height" : 1600},

  "OBJECT_STATE_IDLE" : 0,
  "OBJECT_STATE_MOVE" : 1,

  "FPS" : 60,
  "PLUS_SIZE_WIDTH" : 500,
  "PLUS_SIZE_HEIGHT" : 500,

  "OBJECT_STATE_MOVE_OFFSET" : 99,

  "GAME_STATE_LOAD" : 0,
  "GAME_STATE_START_SCENE" : 1,
  "GAME_STATE_GAME_START" : 2,
  "GAME_STATE_GAME_ON" : 3,
  "GAME_STATE_GAME_END" : 4
}

},{}],5:[function(require,module,exports){
var gameConfig = require('./gameConfig.json');

//must use with bind or call method
exports.rotate = function(){
  // console.log(this);
  if(this.targetDirection === this.direction){
    if(this.currentState === gameConfig.OBJECT_STATE_MOVE){
      this.move();
    }else if(this.currentState === gameConfig.OBJECT_STATE_MOVE_OFFSET){
        //only use at client
        this.moveOffset();
    }
  }
  //check rotate direction
  else if(this.direction > 0 && this.targetDirection < 0){
    if((180 - this.direction + 180 + this.targetDirection) < (this.direction - this.targetDirection)){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction += Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction += this.rotateSpeed;
      }
    }else if(this.targetDirection < this.direction){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction -= Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction -= this.rotateSpeed;
      }
    }
  }else if(this.direction < 0 && this.targetDirection >0 ){
    if((180 + this.direction + 180 - this.targetDirection) < (this.targetDirection - this.direction)){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction -= Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction -= this.rotateSpeed;
      }
    }else if(this.targetDirection > this.direction){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction += Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction += this.rotateSpeed;
      }
    }
  }else if(this.targetDirection > this.direction){
    if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
      this.direction += Math.abs(this.targetDirection - this.direction);
    }else{
      this.direction += this.rotateSpeed;
    }
  }else if(this.targetDirection < this.direction){
    if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
      this.direction -= Math.abs(this.targetDirection - this.direction);
    }else{
      this.direction -= this.rotateSpeed;
    }
  }

  if(this.direction >= 180){
    this.direction -= 360;
  }else if(this.direction <= -180){
    this.direction += 360;
  }
};

//must use with bind or call method
exports.move = function(){
  //calculate dist with target
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  if(distX == 0 && distY == 0){
    this.stop();
    this.changeState(gameConfig.OBJECT_STATE_IDLE);
  }
  if(Math.abs(distX) < Math.abs(this.speed.x)){
    this.speed.x = distX;
  }
  if(Math.abs(distY) < Math.abs(this.speed.y)){
    this.speed.y = distY;
  }
  this.position.x += this.speed.x;
  this.position.y += this.speed.y;

  this.center.x += this.speed.x;
  this.center.y += this.speed.y;
};

//must use with bind or call method
//setup when click canvas for move
exports.setSpeed = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  if(distX == 0  && distY ==0){
    this.speed.x = 0;
    this.speed.y = 0;
  }else if(Math.pow(distX,2) + Math.pow(distY,2) < 100){
    this.speed.x = distX;
    this.speed.y = distY;
  }else{
    this.speed.x = (distX>=0?1:-1)*Math.sqrt(Math.pow(this.maxSpeed,2)*Math.pow(distX,2)/(Math.pow(distX,2)+Math.pow(distY,2)));
    this.speed.y = (distY>=0?1:-1)*Math.sqrt(Math.pow(this.maxSpeed,2)*Math.pow(distY,2)/(Math.pow(distX,2)+Math.pow(distY,2)));
  }
};

//must use with bind or call method
// setup when click canvas for move or fire skill
exports.setTargetDirection = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  var tangentDegree = Math.atan(distY/distX) * 180 / Math.PI;
  if(distX < 0 && distY >= 0){
    this.targetDirection = tangentDegree + 180;
  }else if(distX < 0 && distY < 0){
    this.targetDirection = tangentDegree - 180;
  }else{
    this.targetDirection = tangentDegree;
  }
};

//coordinate transform
exports.localToWorldPosition = function(position, offset){
  var newPosition = {
    x : position.x + offset.x,
    y : position.y + offset.y
  };
  return newPosition;
};
exports.worldToLocalPosition = function(position, offset){
  var newPosition = {
    x : position.x - offset.x,
    y : position.y - offset.y
  };
  return newPosition;
};
exports.worldXCoordToLocalX = function(x, offsetX){
  return x - offsetX;
};
exports.worldYCoordToLocalY = function(y, offsetY){
  return y - offsetY;
};
exports.isDrawX = function(x, gameConfig){
  if(x <= gameConfig.userOffset.x - gameConfig.PLUS_SIZE_WIDTH){
    return false;
  }else if(x >= gameConfig.userOffset.x + gameConfig.canvasSize.width + gameConfig.PLUS_SIZE_WIDTH){
    return false;
  }else{
    return true;
  }
};
exports.isDrawY = function(y, gameConfig){
  if(y <= gameConfig.userOffset.y - gameConfig.PLUS_SIZE_HEIGHT){
    return false;
  }else if(y >= gameConfig.userOffset.y + gameConfig.canvasSize.height + gameConfig.PLUS_SIZE_HEIGHT){
    return false;
  }else{
    return true;
  }
};
exports.calculateOffset = function(user, canvasSize){
  var newOffset = {
    x : user.position.x + user.size.width/2 - canvasSize.width/2,
    y : user.position.y + user.size.height/2 - canvasSize.height/2
  };
  return newOffset;
};

},{"./gameConfig.json":4}],6:[function(require,module,exports){
// inner Modules
var util = require('../../modules/public/util.js');
var User = require('../../modules/client/CUser.js');
var CManager = require('../../modules/client/CManager.js');
var gameConfig = require('../../modules/public/gameConfig.json');

var socket;

// document elements
var infoScene, gameScene, standingScene;
var startButton;

var canvas, ctx, scaleFactor;

// const var
var radianFactor = Math.PI/180;
var fps = 1000/60;

// game var
var Manager;

// resource var
var resource;

var userImage, userHand;
var grid;

// game state var
var gameState = gameConfig.GAME_STATE_LOAD;
var gameSetupFunc = load;
var gameUpdateFunc = null;

var drawInterval = null;

//state changer
function changeState(newState){
  clearInterval(drawInterval);
  drawInterval = null;
  switch (newState) {
    case gameConfig.GAME_STATE_LOAD:
      gameState = newState;
      gameSetupFunc = load;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_START_SCENE:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = standby;
      break;
    case gameConfig.GAME_STATE_GAME_START:
      gameState = newState;
      gameSetupFunc = start;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_GAME_ON:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = game;
      break;
    case gameConfig.GAME_STATE_END:
      gameSate = newState;
      gameSetupFunc = null;
      gameUpdateFunc = end;
      break;
  }
  update();
};
function update(){
  if(gameSetupFunc === null && gameUpdateFunc !== null){
    drawInterval = setInterval(gameUpdateFunc,fps);
  }else if(gameSetupFunc !==null && gameUpdateFunc === null){
    gameSetupFunc();
  }
}

//load resource, base setting
function load(){
  setBaseSetting();
  setCanvasSize();
  //event handle config
  startButton.onclick = function(){
    changeState(gameConfig.GAME_STATE_GAME_START);
  };
  window.onresize = function(){
    setCanvasSize();
  };
  changeState(gameConfig.GAME_STATE_START_SCENE);
};
//when all resource loaded. just draw start scene
function standby(){
  drawStartScene();
};
//if start button clicked, setting game before start game
//setup socket here!!! now changestates in socket response functions
var count = 0;
function start(){
  console.log(++count);
  setupSocket();
  socket.emit('reqStartGame');
};
//game play on
function game(){
  drawGame();
};
//show end message and restart button
function end(){

};

//functions
function setBaseSetting(){

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  infoScene = document.getElementById('infoScene');
  gameScene = document.getElementById('gameScene');
  standingScene = document.getElementById('standingScene');
  startButton = document.getElementById('startButton');

  // inner Modules
  util = require('../../modules/public/util.js');
  User = require('../../modules/client/CUser.js');
  CManager = require('../../modules/client/CManager.js');
  gameConfig = require('../../modules/public/gameConfig.json');

  Manager = new CManager(gameConfig);

  // resource 관련
  resource = require('../../modules/client/resource.json');

  userImage = new Image();
  userHand = new Image();
  grid = new Image();
  userImage.src = resource.USER_BODY_SRC;
  userHand.src = resource.USER_HAND_SRC;
  grid.src = resource.GRID_SRC;
};

function setCanvasSize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gameConfig.scaleFactor = 1;
  gameConfig.canvasSize = {width : window.innerWidth, height : window.innerHeight};
};

function drawStartScene(){
  infoScene.classList.add('enable');
  infoScene.classList.remove('disable');
  gameScene.classList.add('disable');
  gameScene.classList.remove('enable');
  standingScene.classList.add('disable');
  standingScene.classList.remove('enable');
};

function drawGame(){
  infoScene.classList.add('disable');
  infoScene.classList.remove('enable');
  gameScene.classList.add('enable');
  gameScene.classList.remove('disable');
  standingScene.classList.add('disable');
  standingScene.classList.remove('enable');

  drawScreen();
  drawGrid();
  drawUser();
};
// socket connect and server response configs
function setupSocket(){
  socket = io();

  //change state game on
  socket.on('resStartGame', function(datas){
    Manager.setUsers(datas);
    Manager.synchronizeUser(gameConfig.userID);

    console.log(Manager.users);

    canvasAddEvent();

    changeState(gameConfig.GAME_STATE_GAME_ON);
  });
  socket.on('setSyncUser', function(user){
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);
    // Manager = new CManager(gameConfig);
  });

  socket.on('userJoined', function(data){
    Manager.setUser(data);

    console.log(Manager.users);
  });

  socket.on('resMove', function(userData){
    if(userData.objectID === gameConfig.userID){
      gameConfig.userOffset = util.calculateOffset(userData, gameConfig.canvasSize);
    }
    console.log(userData);
    console.log('move start');
    Manager.moveUser(userData);
  });
  //
  // socket.on('resSetCanvasSize', function(canvasSize, scaleFactor){
  //   // var beforeOffset = gameConfig.userOffset;
  //   gameConfig.scaleFactor = scaleFactor;
  //   gameConfig.canvasSize = canvasSize;
  //   // gameConfig.userOffset = util.calculateOffset(, gameConfig.canvasSize);
  //   // Manager.reCalcLocalPosition(beforeOffset, gameConfig.userOffset);
  //   //may need cancel drawInterval for a while
  //
  //   //css height, width change
  //
  //   setCanvasSize(scaleFactor);
  // });
};

//draw
function drawScreen(){
  //draw background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

function drawUser(){
  for(var index in Manager.users){
    var radian = Manager.users[index].direction * radianFactor;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(Manager.users[index].center.x, Manager.users[index].center.y);
    ctx.rotate(radian);
    ctx.drawImage(userHand, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);

    ctx.restore();
  }
};

function drawGrid(){
  //draw boundary

  //draw grid
  for(var i=0; i<gameConfig.CANVAS_MAX_SIZE.width; i += resource.GRID_SIZE){
    if(util.isDrawX(i, gameConfig)){
      var x = util.worldXCoordToLocalX(i, gameConfig.userOffset.x);
      for(var j=0; j<gameConfig.CANVAS_MAX_SIZE.height; j += resource.GRID_SIZE){
        if(util.isDrawY(j, gameConfig)){
          var y = util.worldYCoordToLocalY(j, gameConfig.userOffset.y);
          ctx.drawImage(grid, x, y);
        }
      }
    }
  }
};

function canvasAddEvent(){
  canvas.addEventListener('click', function(e){
    var targetPosition ={
      x : e.clientX,
      y : e.clientY
    }
    var worldTargetPosition = util.localToWorldPosition(targetPosition, gameConfig.userOffset);
    socket.emit('reqMove', worldTargetPosition);
  }, false);
}

update();
// local utils
// function setCanvasSize(scaleFactor){
//   // canvas.style.width = (canvas.width * scaleFactor) + 'px';
//   // canvas.style.height = (canvas.height * scaleFactor) + 'px';
//   canvas.width = window.innerWidth;
//   canvas.height = window.innerHeight;
//
// };
// function getWindowSize(){
//   var returnVal = {
//     width : window.innerWidth,
//     height : window.innerHeight
//   }
//   return returnVal;
// };
// function setCanvasSizeAndScale(windowSize, canvasMaxSize){
//   if(windowSize.width >= canvasMaxLocalSize.width || windowSize.height >= canvasMaxLocalSize.height){
//     var scaleFactor = (windowSize.width / canvasMaxLocalSize.width) > (windowSize.height / canvasMaxLocalSize.height) ?
//                   (windowSize.width / canvasMaxLocalSize.width) : (windowSize.height / canvasMaxLocalSize.height);
//     // localConfig.canvasSize = {
//     //   width : config.canvasMaxLocalSize.width,
//     //   height : config.canvasMaxLocalSize.height
//     // };
//   }
//   gameConfig.scaleFactor = scaleFactor;
//   gameConfig.canvasSize = windowSize;
//   return 1;
// }

},{"../../modules/client/CManager.js":1,"../../modules/client/CUser.js":2,"../../modules/client/resource.json":3,"../../modules/public/gameConfig.json":4,"../../modules/public/util.js":5}]},{},[6]);
