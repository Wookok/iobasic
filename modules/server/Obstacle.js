var GameObject = require('./GameObject.js');

function Obstacle(){
  GameObject.call(this);
  this.objectID = null;

  this.userTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };
};

Obstacle.prototype = Object.create(GameObject.prototype);
Obstacle.prototype.constructor = LivingEntity;
