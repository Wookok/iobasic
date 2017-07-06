var LivingEntity = require('./LivingEntity.js');

function User(id){
  LivingEntity.call(this);

  this.socketID = id;
};
User.prototype = Object.create(LivingEntity.prototype);
User.prototype.constructor = LivingEntity;

module.exports = User;
