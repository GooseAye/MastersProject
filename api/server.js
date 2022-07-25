const e = require('cors');
const express = require('express');
const mySQL = require('mysql2');
const app = express();
var http = require('http');
const { allowedNodeEnvironmentFlags } = require('process');
const socket = require('socket.io');
const db = require('./models')
//const sequelize = require('sequelize')
const { UserAccount } = require('./models');

// Classes for the structure of the application. 

// Lobby Class means we can keep an object that associates a LobbyID with the lobby users.
class Lobby {
    constructor(id){
        this.LobbyID = id;
        this.lobbyUsers = [];
        this.numberOfUsers = 0;
    }

    addUser(userID){
        if(this.numberOfUsers >= 4){
            console.log("Error. Lobby is currently full");
            return false;
        }else{
            this.lobbyUsers[this.numberOfUsers++] = userID;
            for(var i = 0; i < this.numberOfUsers; i++){
                console.log(this.lobbyUsers[i]);
            }
        }
    }

    removeUser(userID){
        for(var i = 0; i < this.numberOfUsers; i++){
            if(this.lobbyUsers[i] === userID){
                for(var j = i; j < this.numberOfUsers-1; j++){
                    this.lobbyUsers[j]= this.lobbyUsers[j+1]
                }
                this.lobbyUsers[this.numberofUsers--] = null;
            }
        }
    }

    
}

//Adding Support for a socket connection: https://www.thirdrocktechkno.com/blog/node-js-socket-io-chrome-extension-integration/

//Creating an HTTP Server to open a socket

const PORT = 3080;
var availableLobbies = [];
var numberOfLobbies = 0;
//var socketServ = undefined;


//db.sequelize.sync().then((req) => { 
    //socketServ = app.listen(PORT, function(){
        //console.log('Server started on port ' + PORT);
       // console.log('http://localhost:' + PORT);
    //})
//})
db.sequelize.sync();

const socketServ = app.listen(PORT, function(){
    console.log('Server started on port ' + PORT);
    console.log('http://localhost:' + PORT);
})


const io = socket(socketServ, {
    cors: {
        //origin: "138.68.132.17:3080",
        origin: "localhost",
        //origin: "localhost",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});

// Adding the socket.io Functionality here:

io.on('connection', (socket) => {
	console.log('Test complete. Socket connection has been established' + socket.id);
    socket.emit('testMessage');

    socket.on('JoinLobby', (lobbyID, UserID) => {
        console.log("User is trying to join lobby: " + lobbyID);
        for(var i = 0; i < numberOfLobbies; i++){
            if(availableLobbies[i].LobbyID === lobbyID){
                socket.join(availableLobbies[i]);
                console.log("User has successfully joined the lobby " + lobbyID);
                availableLobbies[i].addUser(UserID);
                socket.emit('lobbySuccess', [lobbyID, availableLobbies[i].lobbyUsers]);
                socket.nsp.to(availableLobbies[i]).emit('updateUsers', [availableLobbies[i].lobbyUsers, availableLobbies[i].LobbyID])
                return;
            }else{
                continue;
            }
        }
        socket.emit('lobbyFailure');
        console.log("Lobby failure, my g");
    })

    socket.on('CreateNewLobby', (newLobbyID, user) => {
        console.log('Creating new Lobby with ID: ' + newLobbyID);
        var newLobby = new Lobby(newLobbyID);
        availableLobbies[numberOfLobbies] = newLobby;
        
        socket.join(availableLobbies[numberOfLobbies]);
        availableLobbies[numberOfLobbies].addUser(user);
        console.log(user.username)

        //socket.nsp.to(availableLobbies[numberOfLobbies]).emit('updateUsers', availableLobbies[numberOfLobbies].lobbyUsers)
        socket.in(availableLobbies[numberOfLobbies]).broadcast.emit('updateUsers', (availableLobbies[numberOfLobbies].lobbyUsers, availableLobbies[numberOfLobbies].LobbyID))
        numberOfLobbies++;

        console.log(availableLobbies[numberOfLobbies-1].lobbyUsers)

        for(var i = 0; i< numberOfLobbies; i++){
            console.log(availableLobbies[i].LobbyID);
        }
        console.log(numberOfLobbies);
    })

    socket.on('closeLobby', (lobbyID) => {
        for(var i = 0; i < numberOfLobbies; i++){
            if(availableLobbies[i].LobbyID === lobbyID){
                for(var j = i; j < numberOfLobbies-1; j++){
                    availableLobbies[i] = availableLobbies[i+1]
                }
                availableLobbies[numberOfLobbies--] = null;

                //Need code to notify all users in that lobby that it has been closed.
            }
        }
    })
    socket.on('playerLeft', (LobbyUsers, lobbyID, userID) => {
        console.log('Looking for lobby... ' + lobbyID)
        for(var i = 0; i < availableLobbies.length; i++){
            if(availableLobbies[i] != undefined){
                if(availableLobbies[i].LobbyID === lobbyID){
                    console.log(lobbyID + ' found.')
                    availableLobbies[i].lobbyUsers = LobbyUsers;
                    socket.in(availableLobbies[i]).broadcast.emit('updateUsers', availableLobbies[i].lobbyUsers, availableLobbies[i].LobbyID);
                    console.log('emitted update to front end');
                    socket.in(availableLobbies[i]).broadcast.emit('player_leave_message', userID);
                }
            }   
        }
    })
    socket.on('gameModeAndTime', (lobbyID, gameMode, timer) => {
        console.log('69 Attempting to update gamemode')
        for(var i = 0; i < availableLobbies.length; i++){
            if(availableLobbies[i] != undefined){
                if(availableLobbies[i].LobbyID === lobbyID){
                    console.log('69 found the lobby')
                    socket.in(availableLobbies[i]).broadcast.emit('updateGameModeAndTime', lobbyID, gameMode, timer)
                    console.log('69 emitted the message to front end')
                }
            }            
        }
    })

    socket.on('countriesToVisit', (lobbyID, countriesToVisit) => {
        for(var i = 0; i < availableLobbies.length; i++){
            if(availableLobbies[i] != undefined){
                if(availableLobbies[i].LobbyID === lobbyID){
                    socket.in(availableLobbies[i]).broadcast.emit('receiveCountriesToVisit', lobbyID, countriesToVisit);
                }
            }
        }
    })

    socket.on('newUser', (userID, usergoogleID) => {
        UserAccount.findAll({ where: { googleID: usergoogleID}}).then((users => {
            if(users.length === 0){
                UserAccount.create({
                    username: userID,
                    gamesPlayed: 0,
                    wonGames: 0,
                    googleID: usergoogleID,
                }).catch((err) => {
                    if(err){
                        throw err;
                    }
                })
            }else{
                console.log("Error, user already in table")
                console.log(users);
            }
        }))
        

    })
    socket.on('endBingoGame', (lobbyID, winnerID) => {
        for(var i = 0; i < availableLobbies.length; i++){
            if(availableLobbies[i] != undefined){
                if(availableLobbies[i].LobbyID === lobbyID){
                    socket.in(availableLobbies[i]).broadcast.emit('endBingoModeGame', lobbyID, winnerID);
                }
            }            
        }
    })

    socket.on('newUsername', (usergoogleID, newID) => {
        UserAccount.update({ username: newID }, {where: { googleID: usergoogleID }}).then((res) => {
            console.log(res);
        })
    })
    socket.on('gameWon', (usergoogleID) => {
        UserAccount.increment('wonGames', { by: 1, where: { googleID: usergoogleID}});
    })

    socket.on('RetrieveUsers', () => {
        UserAccount.findAll().then((users) => {
            chrome.storage.local.set({gameUsers: users})

        })
    })

    socket.on('doesUserExist', (userGoogleID) => {
        console.log("Query received");
        console.log(userGoogleID);
        UserAccount.findAll({ where: { googleID: userGoogleID }}).then((users) => {
            console.log(users);
            if(users.length === 0){
                socket.emit('UserNotFound')
            }else{
                socket.emit('UserFound', users)
            }
        })
    })

    socket.on('playerReady', (user, lobbyID) => {
        for(var i = 0; i < numberOfLobbies; i++){
            if(availableLobbies[i].LobbyID === lobbyID){
                socket.nsp.to(availableLobbies[i]).emit('player_is_ready', user, lobbyID);
            }
        }
    })

    socket.on('scoreUpdate', (user, lobbyID, userScore) => {
        for(var i = 0; i < numberOfLobbies; i++){
            if(availableLobbies[i].LobbyID === lobbyID){
                for(var j = 0; j < availableLobbies[i].lobbyUsers.length; j++){
                    if(availableLobbies[i].lobbyUsers[j].userID === user.userID){
                        availableLobbies[i].lobbyUsers[j].score = userScore;
                        socket.nsp.to(availableLobbies[i]).emit('updateUsers', availableLobbies[i].lobbyUsers, availableLobbies[i].LobbyID)
                    }
                }
            }
        }
    })

    socket.on('bingoScoreUpdate', (userProfile, lobbyID) => {
        for(var i = 0; i < numberOfLobbies; i++){
            if(availableLobbies[i].LobbyID === lobbyID){
                for(var j = 0; j < availableLobbies[i].lobbyUsers.length; j++){
                    if(availableLobbies[i].lobbyUsers[j].userID === userProfile.userID){
                        availableLobbies[i].lobbyUsers[j].BingoCountries = userProfile.BingoCountries;
                        socket.nsp.to(availableLobbies[i]).emit('updateUsers', availableLobbies[i].lobbyUsers, availableLobbies[i].LobbyID)
                    }
                }
            }
        }
    })

    socket.on('startTheGame', (lobbyID) => {
        for(var i = 0; i < numberOfLobbies; i++){
            if(availableLobbies[i].LobbyID === lobbyID){
                socket.nsp.to(availableLobbies[i]).emit('startGame', availableLobbies[i].LobbyID)
                for(var j = 0; j < availableLobbies[i].lobbyUsers.length; j++){
                    UserAccount.increment('gamesPlayed', { by: 1, where: { username: availableLobbies[i].lobbyUsers[j].userID }})
                }
            }
        }
    })
})

var nodeServer = http.createServer(app);


// Adding support for mySQL - Create connection to MYSQL - https://www.youtube.com/watch?v=EN6Dx22cPRI&ab_channel=TraversyMedia

nodeServer.listen(3090, function(){
    console.log("The server is now running on port " + 3090)
})

app.get('/', function(req, res){
    res.send("This is a test");
    console.log("User has connected " + req.id);
});

app.get('/socket.io', function(req, res){
    res.send("test passed")
})

app.post('/socket.io', function(req, res){
    res.send("Post test passed")
})

// Database methods

app.get('/select', (req, res) => {
    res.send('select')
});

app.get('/insert', (req, res) => {
    UserAccount.create({
        username: "Goose",
        gamesPlayed: 0,
        wonGames: 0,
        googleID: "test",
    }).catch(err => {
        if(err){
            throw err;
        }
    })

    res.send('Mhmm');
});

app.get('/delete', (req, res) => {
    res.send('delete')
});
