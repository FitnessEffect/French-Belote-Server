var path = require('path');
var fs = require('fs');
var Game = require("./game");
var Room = require("./room");
var tempPlayers = [];
var rooms = [];
var players = [];
var team1 = 0;
var team2 = 0;
var passedCount = 0;
var card;

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

io.sockets.on("connection", function(socket) {
    console.log("Connection was made!");

    socket.emit("allRooms", rooms);

    socket.on("createRoom", function(data) {

        //roomId = "room1";
        var tempID = randomString(12);
        var room = new Room(tempID);
        room.name = data.name;
        //rooms = [room];
        rooms.push(room);
        room.id = tempID;
        socket.emit("allRooms", rooms);
    });


    socket.on("addNewPlayer", function(data) {
        //select correct room
        for (var x = 0; x < rooms.length; x++) {
            if (rooms[x].id == data.roomID) {
                if (rooms[x].players.length < 4) {
                    //room has under 4 players
                    socket.join(rooms[x].id);
                    rooms[x].addNewPlayer(data, function(roomId, players) {
                        io.to(rooms[x].id).emit("playerJoined", {
                            "id": players[players.length - 1].id,
                            "username": players[players.length - 1].username,
                            "players": players,
                            "roomId": roomId
                        });
                    });
                } else {
                    //room is full
                }
            }
        }
    });

    socket.on("nudge", function(data) {
        for (var x = 0; x < rooms.length; x++) {
            if (rooms[x].id == data.roomID) {
                let tempNum = rooms[x].getNumFromId(data.uid);
                data.num = tempNum;
                socket.broadcast.emit("nudge", data);
            }
        }
    });

    socket.on("removeRoom", function(data){
      for (var x = 0; x < rooms.length; x++) {
          if (rooms[x].id == data.roomID) {
            rooms = rooms.splice(x, 1);
            socket.emit("allRooms", rooms);
          }
      }
    });

    socket.on("startGame", function(data) {
        for (var x = 0; x < rooms.length; x++) {
            if (rooms[x].id == data.roomID) {
                rooms[x].resetGame();
                rooms[x].saveStartingPlayerId(data.uid);
                io.to(rooms[x].id).emit("clearAtout");
                rooms[x].dealCards(function(players) {
                    tempPlayers = players;
                });
                card = rooms[x].showOneCard();
                io.to(rooms[x].id).emit("showCard", card);
                io.to(rooms[x].id).emit("cardsDealt", tempPlayers);
                io.to(rooms[x].id).emit("selectAtout", data.uid);
            }
        }
    });


    socket.on("playerLeft", function(data) {

        for (var x = 0; x < rooms.length; x++) {
            if (rooms[x].id == data.roomID) {
                rooms[x].playerLeft(data);
                io.to(rooms[x].id).emit("removePlayer", data);
            }
        }
    });

    socket.on("refreshTableView", function(data){
      socket.emit("allRooms", rooms);
    });

    socket.on("setAtout", function(data) {
        for (var x = 0; x < rooms.length; x++) {
            if (rooms[x].id == data.roomID) {
                if (data.atout == "pass") {
                    passedCount = passedCount + 1;
                    for (var i = 0; i < rooms[x].players.length; i++) {
                        if (rooms[x].players[i].id == data.uid) {
                            //all the players passed once
                            if (passedCount == rooms[x].players.length) {
                                passedCount = 0;
                                if (i == rooms[x].players.length - 1) {
                                    io.to(rooms[x].id).emit("selectAtout", rooms[x].players[0].id);
                                } else {
                                    io.to(rooms[x].id).emit("selectAtout", rooms[x].players[i + 1].id);
                                }
                            } else {
                                if (i == rooms[x].players.length - 1) {
                                    io.to(rooms[x].id).emit("selectAtout", rooms[x].players[0].id);
                                } else {
                                    io.to(rooms[x].id).emit("selectAtout", rooms[x].players[i + 1].id);
                                }
                            }
                        }
                    }
                } else {
                    rooms[x].setAtout(data.atout);
                    io.to(rooms[x].id).emit("atoutSelected", data.atout);
                    //io.to(roomId).broadcast.emit("atoutSelected", data.atout);
                    io.to(rooms[x].id).emit("clearWageCard", data);
                    rooms[x].distributeWageCard(data.id);
                    //rooms[rooms.length-1].dealCards();
                    rooms[x].dealCards(function(players) {
                        tempPlayers = players;
                    });
                    //io.to(roomId).broadcast.emit("cardsDealt", tempPlayers);
                    io.to(rooms[x].id).emit("cardsDealt", tempPlayers);
                    io.to(rooms[x].id).emit("waitingPlayers", rooms[rooms.length - 1].getStartingPlayerId());
                }
            }
        }
    });

    socket.on("cardPlayed", function(data) {
        for (var x = 0; x < rooms.length; x++) {
            if (rooms[x].id == data.roomID) {
                rooms[x].cardPlayed(data);

                io.to(rooms[x].id).emit("displayCard", data);

                if (rooms[x].getCardOnTable().length != rooms[x].players.length) {
                    for (var i = 0; i < rooms[x].players.length; i++) {

                        if (rooms[x].players[i].id == data.id) {
                            if (i == rooms[x].players.length - 1) {
                                io.to(rooms[x].id).emit("waitingPlayers", rooms[x].players[0].id);
                            } else {
                                io.to(rooms[x].id).emit("waitingPlayers", rooms[x].players[i + 1].id);
                            }
                        }
                    }
                }

                if (rooms[x].getCardOnTable().length == rooms[x].players.length) {
                    //find round winner
                    var winnerPlayer = rooms[x].compareCards();
                    var winnerTeamMate = rooms[x].getTeamMate(winnerPlayer);

                    //calculate team points for round
                    var roundPoints = rooms[x].updateScore(winnerPlayer);

                    io.to(rooms[x].id).emit("roundResult", {
                        "winnerID": winnerPlayer.id,
                        "score": roundPoints,
                        "teamMateID": winnerTeamMate.id
                    });

                    var roundCount = 0;
                    var winnerReference = "";

                    if (data.lastCard == 1) {
                        roundCount = rooms[x].updateRoundScore(winnerPlayer);
                        winnerReference = rooms[x].getWinnerRoundScore(winnerPlayer);

                        io.to(rooms[x].id).emit("roundCountUpdate", {
                            "roundCount": roundCount,
                            "winnerReference": winnerReference
                        });

                        // var followingPlayerId = rooms[x].getFollowingStartingPlayerId();
                        // io.to(rooms[x].id).emit("followingStartPlayerId", followingPlayerId);

                    }

                    rooms[x].clearCardOnTable();
                    io.to(rooms[x].id).emit("clearBoard");
                    io.to(rooms[x].id).emit("waitingPlayers", winnerPlayer.id);
                }
            }
        }
    });
});

// create room id
function randomString(length) {
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (var i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}
