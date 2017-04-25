var path = require('path');
var fs = require('fs');
var Game = require("./game");
var Room = require("./room");
var tempPlayers = [];
var rooms;
var players = [];
var team1 = 0;
var team2 = 0;
var passedCount = 0;
var card;
var roomId;

//typical express port
const PORT = 8080;

const express = require('express');

var bodyParser = require('body-parser');

const serveStatic = require('serve-static');

const app = express();
var server = require("http").createServer(app).listen(PORT);
var io = require("socket.io").listen(server);

app.use(serveStatic('dist', {
    'index': ['index.html']
}));

app.post("/start", function(request, response, next) {
    const player1 = request.body.name;
    response.send({
        name: player1
    });
    next();
});

app.post("/ping", function(request, response) {
    response.send("POST ping");
});

app.get("/ping", function(request, response) {
    response.send("GET response from ping");
});

//app.listen(PORT);
console.log('Running on http://localhost:' + PORT);

function emitAtOut(message) {
    //socket.emit('')....
}

function emitToRoom(id, eventToEmit) {
  io.to(id).emit("");
}

//emit fires an event and sending to client (in swift file)
//io.sockets.on listening
// Player.uid, Player.sid
io.sockets.on("connection", function(socket) {
    console.log("Connection was made!");


    //socket.client.emit('', function() {})
    //if rooms.players < 4 add player else push new room and all player
    // if (...) { rooms[rooms.length - 1].addNewPlayer(); }
    // else { var newID = randomString(12);  rooms.push(new Room(newID); )}
    //handle room
    // rooms.push({
    //     id: "room1",
    //     players: 0
    // });
    if (!rooms){
        var room = new Room("room1");
        rooms = [room];
        roomId = "room1";
    }else{
      //skip
    }

//add player to the last room that was created
    socket.join(rooms[rooms.length-1].id);
    socket.on("addNewPlayer", function(data) {
      console.log("NEW PLAYER");
      console.log(data);
      //select correct room
      rooms[rooms.length-1].addNewPlayer(data, function(roomId, players){
        io.to(roomId).emit("playerJoined", {
          "id": players[players.length-1].id,
          "username": players[players.length-1].username,
          "players": players,
          "roomId": roomId
        });
      });
    });

    //no need?
    socket.on("updatePlayers", function(data){
      for(var i =0; i< rooms[rooms.length-1].players.length-1; i++){
        socket.emit("playerJoined", {"id":rooms[rooms.length-1].players[i].id, "username":rooms[rooms.length-1].players[i].username});
      }
    });

    socket.on("nudge", function(data){
      //io.to(roomId).emit("nudge", data);
      let tempNum = rooms[rooms.length-1].getNumFromId(data.uid);
      data.num = tempNum;
      socket.broadcast.emit("nudge", data);
    });

    socket.on("startGame", function(data) {
        rooms[rooms.length-1].resetGame();
        rooms[rooms.length-1].saveStartingPlayer(data.uid);
        io.to(roomId).emit("clearAtout");
        rooms[rooms.length-1].dealCards(function(players){
          tempPlayers = players;
        });
        card = rooms[rooms.length-1].showOneCard();
        io.to(roomId).emit("showCard", card);
        io.to(roomId).emit("cardsDealt", tempPlayers);
        io.to(roomId).emit("selectAtout", data.uid);
    });

    socket.on("playerLeft", function(data){
      //game.playerLeft(data);
      //socket.broadcast.emit("removePlayer", data);
      rooms[rooms.length-1].playerLeft(data);
      io.to(roomId).emit("removePlayer", data);
    });

    socket.on("setAtout", function(data) {
        if (data.atout == "pass") {
            passedCount = passedCount + 1;
            // find the correct room
            // call some appropriate function
            // pass a callback function to the room
            // in this case, roomMethod(data, emitAtOut);
            // the room method: someMethod(data, callback) { ... callback(message); }

            for (var i = 0; i < rooms[rooms.length-1].players.length; i++) {
                if (rooms[rooms.length-1].players[i].id == data.uid) {
                  //all the players passed once
                  if (passedCount == rooms[rooms.length-1].players.length){
                    //handle reset
                    //io.to(roomId).broadcast.emit("cardsDealt", tempPlayers);

                    passedCount = 0;
                    if (i == rooms[rooms.length-1].players.length-1){
                      io.to(roomId).emit("selectAtout", rooms[rooms.length-1].players[0].id);
                      //io.to(roomId).broadcast.emit("selectAtout", rooms[rooms.length-1].players[0].id);
                    }else{
                    io.to(roomId).emit("selectAtout", rooms[rooms.length-1].players[i + 1].id);
                    //io.to(roomId).broadcast.emit("selectAtout", rooms[rooms.length-1].players[i + 1].id);
                    }
                  }else{
                    if (i == rooms[rooms.length-1].players.length-1){
                      io.to(roomId).emit("selectAtout", rooms[rooms.length-1].players[0].id);
                      //io.to(roomId).broadcast.emit("selectAtout", rooms[rooms.length-1].players[0].id);
                    }else{
                      io.to(roomId).emit("selectAtout", rooms[rooms.length-1].players[i + 1].id);
                      //io.to(roomId).broadcast.emit("selectAtout", rooms[rooms.length-1].players[i + 1].id);

                    }
                  }
                }
            }
        } else {

            rooms[rooms.length-1].setAtout(data.atout);
            io.to(roomId).emit("atoutSelected", data.atout);
            //io.to(roomId).broadcast.emit("atoutSelected", data.atout);
            io.to(roomId).emit("clearWageCard", data);
            rooms[rooms.length-1].distributeWageCard(data.id);
            //rooms[rooms.length-1].dealCards();
            rooms[rooms.length-1].dealCards(function(players){
              tempPlayers = players;
            });
            //io.to(roomId).broadcast.emit("cardsDealt", tempPlayers);
            io.to(roomId).emit("cardsDealt", tempPlayers);
            io.to(roomId).emit("waitingPlayers", rooms[rooms.length-1].getStartingPlayerId());
        }
    });

    socket.on("cardPlayed", function(data) {

      rooms[rooms.length-1].cardPlayed(data);

      io.to(roomId).emit("displayCard", data);
    //  io.to(roomId).broadcast.emit("displayCard", data);

    //  if (game.cardOnTable.length != game.players.length){
    if (rooms[rooms.length-1].getCardOnTable().length != rooms[rooms.length-1].players.length){
        for (var i = 0; i < rooms[rooms.length-1].players.length; i++) {

            if (rooms[rooms.length-1].players[i].id == data.id) {
              if (i == rooms[rooms.length-1].players.length-1){
                //io.to(roomId).broadcast.emit("waitingPlayers", rooms[rooms.length-1].players[0].id );
                io.to(roomId).emit("waitingPlayers", rooms[rooms.length-1].players[0].id );
              }else{
              //io.to(roomId).broadcast.emit("waitingPlayers", rooms[rooms.length-1].players[i+1].id );
              io.to(roomId).emit("waitingPlayers", rooms[rooms.length-1].players[i+1].id );
              }
            }
        }
      }

      //if (game.cardOnTable.length == game.players.length){
      if (rooms[rooms.length-1].getCardOnTable().length == rooms[rooms.length-1].players.length){
      //find round winner
        var winnerPlayer = rooms[rooms.length-1].compareCards();
        var winnerTeamMate = rooms[rooms.length-1].getTeamMate(winnerPlayer);

      //calculate team points for round
        var roundPoints = rooms[rooms.length-1].updateScore(winnerPlayer);


        console.log("ROUND COUNT FOR WINNER AFTER UPDATE");
        console.log(roundCount);

        io.to(roomId).emit("roundResult", {
            "winnerID": winnerPlayer.id,
            "score": roundPoints,
            "teamMateID": winnerTeamMate.id
        });

        var roundCount = 0;
        var winnerReference = "";

        if (data.lastCard == 1){
          roundCount = rooms[rooms.length-1].updateRoundScore(winnerPlayer);
          winnerReference = rooms[rooms.length-1].getWinnerRoundScore(winnerPlayer);

          io.to(roomId).emit("roundCountUpdate", {
            "roundCount": roundCount,
            "winnerReference": winnerReference
          });
        }


        rooms[rooms.length-1].clearCardOnTable();
        io.to(roomId).emit("clearBoard");
        io.to(roomId).emit("waitingPlayers", winnerPlayer.id );
      }
    });
});

// can use this in conjunction with some createNewRoom() method, add it to room as an id
function randomString(length) {
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (var i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}
