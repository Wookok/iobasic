var GameObject = require('./GameObject.js');
var util = require('../public/util.js');

var gameConfig = require('../public/gameConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

function LivingEntity(){
  GameObject.call(this);
  this.objectID = null;

  this.currentState = gameConfig.OBJECT_STATE_IDLE;

  this.speed = {x: 0, y:0};
  this.direction = 0;
  this.rotateSpeed = 0;

  this.maxSpeed = 0;
  this.targetPosition = {
    x : this.position.x, y : this.position.y
  };
  this.targetDirection = 0;

  this.updateInterval = false;
  this.updateFunction = null;

  this.userTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };
};
LivingEntity.prototype = Object.create(GameObject.prototype);
LivingEntity.prototype.constructor = LivingEntity;

//state changer. change update listener
LivingEntity.prototype.changeState = function(newState){
  this.currentState = newState;

  this.stop();
  switch(this.currentState){
    case gameConfig.OBJECT_STATE_IDLE :
      this.updateFunction = this.idle;
      break;
    case gameConfig.OBJECT_STATE_MOVE :
      this.updateFunction = this.rotate.bind(this);
      break;
    }
  this.update();
};
LivingEntity.prototype.update = function(){
  this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
};

//rotate before move or fire skill etc..
LivingEntity.prototype.rotate = function(){
  util.rotate.call(this);
};
//move after rotate
LivingEntity.prototype.move = function(){
  util.move.call(this);
};
LivingEntity.prototype.idle = function(){
  //do nothing or send packet;
};
//interval clear
LivingEntity.prototype.stop = function(){
  if(this.updateInterval){
    clearInterval(this.updateInterval);
    this.updateInterval = false;
  }
};

// setup when click canvas for move
LivingEntity.prototype.setTargetPosition = function(newPosition){
  this.targetPosition.x = newPosition.x;
  this.targetPosition.y = newPosition.y;
};
LivingEntity.prototype.setSpeed = function(){
  util.setSpeed.call(this);
};
LivingEntity.prototype.setTargetDirection = function(){
  util.setTargetDirection.call(this);
};

// initialize method
LivingEntity.prototype.setRotateSpeed = function(x){
  this.rotateSpeed = x;
};
LivingEntity.prototype.setMaxSpeed = function(x){
  this.maxSpeed = x;
};
LivingEntity.prototype.assignID = function(x){
  this.objectID = x;
};

// initialize and update for userTreeEle
LivingEntity.prototype.setUserEle = function(){
  this.userTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };
};

module.exports = LivingEntity;
