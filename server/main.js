
function cleanUpGamesAndPlayers(){ 
  var cutOff = moment().subtract(2, 'hours');
  var numGamesRemoved = Games.remove({
    createdAt: {$lt: cutOff}
  });

  var numPlayersRemoved = Players.remove({
    createdAt: {$lt: cutOff}
  });

  var chatRemoved = Chat.remove({
    createdAt: {$lt: cutOff}
  });
  var newsRemoved = News.remove({
    createdAt: {$lt: cutOff}
  });
}

Meteor.startup(function () {
    // The correct way
    Players.remove({});
    Chat.remove({});
    Games.remove({});
    News.remove({});
});

var everyHour = new Cron(function() {
    cleanUpGamesAndPlayers();
}, {minute: 1});

//set a proper timeout value
// possibly check when last chat or game created time is at

    Meteor.publish('games', function(accessCode) {
    return Games.find({"accessCode": accessCode});
    //return Games.find();
  });

  Meteor.publish('players', function(gameID) {
    return Players.find({"gameID": gameID});
  });

   Meteor.publish('chat', function(gameID) {
    //return Games.find({"accessCode": accessCode});
    return Chat.find({"game": gameID});
  });


   Meteor.publish('news', function(gameID) {
    return News.find({"game": gameID});
  });