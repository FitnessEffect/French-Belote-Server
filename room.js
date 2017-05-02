var Game = require("./game");
var Player = require("./player");
var wageC;
var tempScore;
var team1 = 0;
var team2 = 0;
var roundTeam1 = 0;
var roundTeam2 = 0;
var roundWinners = [];

class Room {
    constructor(id) {
        this.players = [];
        this.game = null;
        this.id = id;
        this.name = "";
    }

    //player joined after login
    addNewPlayer(data, callback) {
        var player = new Player(data.id, this.players.length + 1, data.sid, data.username);
        this.players.push(player);
        if (!this.game) {
            this.game = new Game();
        }
        callback(this.id, this.players);
    }

    playerLeft(data) {
        var context = this;
        for (var i = 0; i < context.players.length; i++) {
            if (context.players[i].id == data.uid) {
                context.players.splice(i, 1);
            }
        }
    }

    getCardOnTable() {
        return this.game.cardOnTable;
    }

    clearCardOnTable() {
        this.game.cardOnTable = [];
    }

    updateScore(player) {
        tempScore = this.game.updateScore(player);
        if ((player.playerNumber == 1) || (player.playerNumber == 3)) {
            team1 = team1 + tempScore;
            //  this.players[0].points = team1;
            //  this.players[2].points = team1;
            return team1;
        } else {
            team2 = team2 + tempScore;
            //  this.players[1].points = team2;
            //  this.players[3].points = team2;
            return team2;
        }
    }

    updateRoundScore(player) {
        if (team1 > team2) {
            roundTeam1 = roundTeam1 + 1;
            return roundTeam1;
        } else {
            roundTeam2 = roundTeam2 + 1;
            return roundTeam2;
        }
    }

    getWinnerRoundScore(player) {
        if (team1 > team2) {
            roundWinners.push(this.players[0]);
            return roundWinners
        } else {
            if (this.players.length > 1) {
                roundWinners.push(this.players[1]);
                return roundWinners
            }
        }
    }

    getNumFromId(pId) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id == pId) {
                return this.players[i].playerNumber;
            }
        }
    }

    saveStartingPlayer(id) {
        this.game.startingPlayer = id;
    }

    getStartingPlayerId() {
        return this.game.startingPlayer;
    }

    getTeamMate(winnerPlayer, callback) {
        if (this.players.length == 4) {
            if (winnerPlayer.playerNumber == 1) {
                //return player 3
                return (this.players[2]);
            } else if (winnerPlayer.playerNumber == 2) {
                //return player 4
                return (this.players[3]);
            } else if (winnerPlayer.playerNumber == 3) {
                //return player 1
                return (this.players[0]);
            } else if (winnerPlayer.playerNumber == 4) {
                //return player 2
                return (this.players[1]);
            }
        }
        if (this.players.length == 3) {
            if (winnerPlayer.playerNumber == 1) {
                //return player 3
                return (this.players[2]);
            } else if (winnerPlayer.playerNumber == 2) {
                //return self
                return (this.players[1]);
            } else if (winnerPlayer.playerNumber == 3) {
                //return player 1
                return (this.players[0]);
            }
        }
        if (this.players.length == 2) {
            if (winnerPlayer.playerNumber == 1) {
                //return self
                return (this.players[0]);
            } else if (winnerPlayer.playerNumber == 2) {
                //return self
                return (this.players[1]);
            }
        }
    }

    resetGame() {
        this.game.resetDeck();
        for (var i = 0; i < this.players.length; i++) {
            this.players[i].hand = [];
        }
        this.game.atout = "";
        this.game.wageCard = "";
    }

    dealCards(callback) {
        this.game.dealCards(this.players);
        callback(this.players);
    }

    cardPlayed(data) {

        // for p in this.players, if player.id == data.id, player.card = data.card, etc
        for (var i = 0; i < this.players.length; i++) {
            if (data.id == this.players[i].id) {
                this.game.cardPlayed(this.players[i], data);

            }
        }
    }

    setAtout(data) {
        this.game.setAtout(data);
    }

    distributeWageCard(data) {
        var context = this;
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id == data) {
                this.game.distributeWageCard(this.players[i], data);
            }
        }
    }

    compareCards() {
        var firstPlayer = this.players[0];
        var secondPlayer = this.players[1];
        for (var i = 0; i < this.players.length - 1; i++) {
            firstPlayer = this.game.compareCards(firstPlayer, secondPlayer);
            secondPlayer = this.players[i + 2];
        }
        return firstPlayer;
        // do stuff based on who is the first player at this point
    }

    showOneCard() {
        wageC = this.game.showOneCard();
        return wageC
    }

    resetPlayers() {
        this.players = [];
    }
}

module.exports = Room;
