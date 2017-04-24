var Player = require("./player");
var shuffle = require("shuffle");
var Card = require("./Card");
var atout = "";
var startingPlayer = "";

class Game {

    constructor() {
        this.wageCard = "";
        this.deck = shuffle.shuffle();
        this.dealCards = this.dealCards.bind(this);
        this.cardOnTable = [];
    }

    resetDeck(){
      this.deck = shuffle.shuffle();
    }

    dealCards(players) {

        var context = this;
        players.forEach(function(player, index) {
            for (var i = 0; i < 52; i++) {
                var card = context.deck.draw(1);
                if ((card.description == "Two") || (card.description == "Three") || (card.description == "Four") || (card.description == "Five") || (card.description == "Six")) {
                    //skip
                } else {
                    player.hand.push(card);
                }
                //var newCard = new Card(card.description, card.suit, -1);

                if (context.wageCard == ""){
                  if (player.hand.length == 5) {
                      break;
                  }
               }else{
                 if (player.hand.length == 8){
                   break;
                 }
               }
            }
        });

        return players;
    }

    distributeWageCard(player){
        player.hand.push(this.wageCard);
    }




   showOneCard(callback){
     var context = this;
     for (var i = 0; i < 52; i++) {
         this.wageCard = context.deck.draw(1);
         if ((this.wageCard.description == "Two") || (this.wageCard.description == "Three") || (this.wageCard.description == "Four") || (this.wageCard.description == "Five") || (this.wageCard.description == "Six")) {
             //skip
         } else {
             return this.wageCard;
         }
       }
   }

    setAtout(data) {
        atout = data;
    }

    cardPlayed(player, data) {
        //add card to table
        this.cardOnTable.push(new Card(data.rank, data.suit, data.value));
        player.assignCard(data.rank, data.suit, data.value);
        console.log("=====Player id = " + player.id + " card Played = " + player.card.rank + " card Value = " + player.card.value)
    }

    // function compareCards(p1, p2) { compare stuff...if more this.players, return compareCards(p2, p3)}
    //check for suit
    compareCards(player, player2, index) {
      console.log("CARD ON TABLE");
      console.log(this.cardOnTable);
        if ((player.card.suit == atout && player2.card.suit == atout) || (player.card.suit != atout && player2.card.suit != atout)) {
          //order of cards played matters
          if (player.card.suit != player2.card.suit){
            console.log("BOTH DIFFERENT SUITS");
            for (var i = 0; i < this.cardOnTable.length; i++){
              if(player.card.suit == this.cardOnTable[i].suit){
                console.log("FIRST PLAYER IN COMPARISON WON");
                console.log(player.playerNumber);
                    return player;
              }else if (player2.card.suit == this.cardOnTable[i].suit){
                console.log("SECOND PLAYER IN COMPARISON WON");
                console.log(player2.playerNumber);
                    return player2;
              }
            }
          }
            if (player.card.value > player2.card.value) {
                    return player;
            }

            if (player2.card.value > player.card.value) {
                    return player2;
            }
            //if value is the same
            if (player.card.value == player2.card.value) {
                if (player.card.rank > player2.card.rank) {
                        return player;
                } else if (player2.card.rank > player.card.rank) {
                        return player2;
                } else if (player.card.rank == player2.card.rank){
                      return player;
                }
            }
        }
        //if one is atout and the other is not
        if (player.card.suit == atout) {
                return player;
        } else if (player2.card.suit == atout) {
                return player2;
        }
    }

    //function to calculate points for given card
    updateScore(player) {
      var tempScore = 0;
      for(var i=0; i<this.cardOnTable.length; i++){
        tempScore = tempScore + this.cardOnTable[i].value;
      }
      return tempScore
    }

}

module.exports = Game;
// module.exports.cardPlayed = cardPlayed;
// module.exports.compareCards = compareCards;
// module.exports.resetthis.players = resetthis.players;
// module.exports.addNewPlayer = addNewPlayer;
// module.exports.setAtout = setAtout;
// module.exports.updateScore = updateScore;
// module.exports.dealCards = dealCards;
