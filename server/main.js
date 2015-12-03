
function cleanUpGamesAndPlayers(){ 
  var cutOff = moment().subtract(2, 'hours').toDate().getTime();
  console.log(cutOff);
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
    Players.remove({});
    Chat.remove({});
    Games.remove({});
    News.remove({});
});

var everyHour = new Cron(function() {
    cleanUpGamesAndPlayers();
}, {minute: 1});

    Meteor.publish('games', function(accessCode) {
    return Games.find({"accessCode": accessCode});
  });

  Meteor.publish('players', function(gameID) {
    return Players.find({"gameID": gameID});
  });

   Meteor.publish('chat', function(gameID) {
    return Chat.find({"game": gameID});
  });


   Meteor.publish('news', function(gameID) {
    return News.find({"game": gameID});
  });