var Card = require("./Card");
class Player{

  constructor(id, playerNumber, sid, username){
    this.id = id;
    this.points = 0;
    this.playerNumber = playerNumber;
    this.username = username;
  //  this.playerNumber = options.playerNumber ? options.playerNumber : -1;
    this.sid = sid;
    this.hand = [];
  }

  //class method
  assignCard(rank, suit, value){
    this.card = new Card(rank, suit, value);
  }

}

module.exports = Player;
