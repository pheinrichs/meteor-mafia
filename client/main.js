//evanbrumley Spyfall access link
function getAccessLink()
{
  var game = getCurrentGame();
  if (!game){
    return;
  }
  return game.accessCode;
}
//--
function stateMachine()
{
  var gameID = Session.get("gameID");
  var playerID = Session.get("playerID");
  if(!gameID || !playerID){  

      Session.set("template_select","start_screen");
      return;
  }
  
  var game = Games.findOne(gameID);
  var player = Players.findOne(playerID);
  if (!game || !player){
      Session.set("gameID", null);
      Session.set("playerID", null);
      Session.set("template_select", "start_screen");
      return;
  }
  if(game.state === "waitingForPlayers"){
    Session.set("template_select","queue_list");
  }
  else if(game.state === "day")
  {
    Session.set("template_select","day");
  }
   else if(game.state === "night")
  {
    Session.set("template_select","day");
  }
  else if(game.state === "inspection")
  {
    Session.set("template_select","day");
  }
  else if(game.state === "medic")
  {
    Session.set("template_select","day");
  }
  else if(game.state === "game_over")
  {
    Session.set("template_select","game_over");
  }
  else if(game.state === null)
  {
    Session.set("template_select","start_screen");
  }
}
//evanbrumley Spyfall
function createSessionID()
{
  var ID = "";
  var options = "abcdefghijklmnopqrstuvwxyz";
    for(var i=0; i < 6; i++){
      ID += options.charAt(Math.floor(Math.random() * options.length));
    }
    return ID;
}
//--
function getCurrentGame()
{
  var gameID = Session.get("gameID");
  if (gameID) {
    return Games.findOne(gameID);
  }
}

function getCurrentPlayer()
{
  var playerID = Session.get("playerID");
  if (playerID) {
    return Players.findOne(playerID);
  }
}
function getVotedPlayer(id)
{
  if (id) {
    return Players.findOne(id);
  }
}

function generateNewGame(game, name)
{
  var game = {
    accessCode: createSessionID(),
    createdAt: moment().format(),
    state: "waitingForPlayers",
    gameTime: "Day",
    global: true,
    special: null,
    winner: null,
    isInspector: false,
    day: 1
  };
  var gameID = Games.insert(game);
  game = Games.findOne(gameID);
  return game;
}

function generateNewPlayer(game, name, pass)
  {
  var player = {
    gameID: game._id,
    createdAt:  moment().format(),
    name: name,
    pass: pass,
    colour: 'sms_01',
    role: null,
    voteCast: null,
    isNarrator: false,
    votes: 0,
    isMafia: false,
    alive: true
  };

  var playerID = Players.insert(player);

  return Players.findOne(playerID);
}

function createCustomArray(word,amount)
{
  var tempArray = [];
  if(amount != 0 ){
  for(var i = 0; i < amount; i++)
  {
    tempArray.push(word);
  }
  return tempArray;
  }
  return tempArray;
}

function checkVotes(day)
{
    var game = getCurrentGame();
    var totalPlayers = Players.find({'gameID': game._id,  'alive': true, 'isNarrator': false},{}).fetch();

    var totalMafia = Players.find({'gameID': game._id,'isMafia':true, 'alive':true},{}).fetch();

    var chats = Chat.find({'game': game._id},{}).fetch();
    var player = Players.findOne({'gameID': game._id}, {'sort': {'votes': -1}});
    if(day == "day")
    {
     if(player.votes > (totalPlayers.length / 2 ))
       {
        communityNews(player.name);
        Players.update(player._id, {$set: {alive: false}});

        totalMafia = Players.find({'gameID': game._id,'isMafia':true, 'alive':true},{}).fetch();
        var totalOther = Players.find({'gameID': game._id,'isMafia':false, 'alive':true, 'isNarrator': false},{}).fetch();

        if(totalMafia.length === 0)
        {
          Games.update(game._id, {$set: {winner: "Civilians",special: "No Mafia remain in the town.",state: 'game_over'}});
        }
        else if(totalOther.length === 0)
        {
           Games.update(game._id, {$set: {winner: "The Mafia",special: "The Mafia were the last ones standing.",state: 'game_over'}});
        }
        else if(totalMafia.length === totalOther.length){
           Games.update(game._id, {$set: {winner: "The Mafia",special: "The Mafioso were equal to the Civilians, Mafia win.",state: 'game_over'}});
        }
        else
        {
        Games.update(game._id, {$set: {gameTime: "Night"}});
        totalPlayers.forEach(function(each)
        {
          Players.update(each._id, {$set: {votes: 0,voteCast: null}});
        });
        //purge chat at the end of every phase
        chats.forEach(function(chat){
          Chat.remove(chat._id);
        });

        var isInspectorStillAlive = Players.find({'gameID': game._id,  'alive': true, 'role': 'inspector'},{}).fetch();

        if(isInspectorStillAlive.length == 0)
        {
          Games.update(game._id, {$set: {state: 'night'}});
        }
        else
        {
          Games.update(game._id, {$set: {state: 'inspection'}});    
        }
      }
      }
    }
    else
    {
       if(player.votes == totalMafia.length)
        {
          mafiaNews(player.name);
          Players.update(player._id, {$set: {alive: false}});

          totalMafia = Players.find({'gameID': game._id,'isMafia':true, 'alive':true},{}).fetch();
          var totalOther = Players.find({'gameID': game._id,'isMafia':false, 'alive':true, 'isNarrator': false},{}).fetch();

          if(totalMafia.length === 0)
          {
            Games.update(game._id, {$set: {winner: "Civilians",special: "No Mafia remain in the town.",state: 'game_over'}});
          }
          else if(totalOther.length === 0)
          {
             Games.update(game._id, {$set: {winner: "The Mafia",special: "The Mafia were the last ones standing.",state: 'game_over'}});
          }
          else if(totalMafia.length === totalOther.length)
          {
             Games.update(game._id, {$set: {winner: "The Mafia",special: "The Mafioso were equal to the Civilians, Mafia win.",state: 'game_over'}});
          }
          else
          {
          Games.update(game._id, {$set: {gameTime: "Day",day: game.day + 1}});
          totalPlayers.forEach(function(each)
          {
            Players.update(each._id, {$set: {votes: 0,voteCast: null}});
          });
          //purge chat at the end of every phase
          chats.forEach(function(chat){
            Chat.remove(chat._id);
          });
          Games.update(game._id, {$set: {state: 'day'}});
        }
        }
      }
    }

function shuffleArray(array) 
{
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function deaths()
{
  var deaths = ['were shot',
  'were hung',
  'were decapitated',
  'were suffocated with a pillow',
  'were drowned',
  'were stung',
  'were sucked into a toilet',
  'tripped on a rock',
  'choked on a nugget',
  'traded his families only cow for "Magical" beans, and were mugged'];
  var item = deaths[Math.floor(Math.random()*deaths.length)];
  return item;
}

function noun()
{
  var who = ['an angry mob',
  'break dancers',
  'Aunt Jemima',
  'Donald Trump',
  'Peter Pan',
  'disgruntled mimes',
  'a rooster'];
  var item = who[Math.floor(Math.random()*who.length)];
  return item;
}

function locations()
{
  var locations = ['at the park',
  'on a boat',
  'at a party',
  'at home',
  'in their treehouse',
  'at starbucks',
  'at the library',
  'at a water park'];
  var item = locations[Math.floor(Math.random()*locations.length)];
  return item;
}

function verbs()
{
  var verb = ['skipping rocks',
  'eating',
  'drinking coffee',
  'watching netflix',
  'sleeping',
  'roasting mashmellow',
  'kissing frogs hoping to find their prince',
  'swimming with sharks'];
  var item = verb[Math.floor(Math.random()*verb.length)];
  return item;
}

function mafiaNews(playerName)
{
  var death = deaths();
  var who = noun();
  var location = locations();
  var verb = verbs();
  var game = getCurrentGame();
  var reason = "Last night " + playerName + " was " + verb + " " + location + " unfortunaly they " + death + " by " + who + "."; 
  Meteor.subscribe('news',game._id);
  if(game.global)
  {
    News.insert({
        name: playerName,
        summary: "killed",
        reason: reason,
        createdAt: moment().format(), // current time
        game: Session.get("gameID"), //get gameID for chat reference
    });
  }
  else
  {
    News.insert({
        name: playerName,
        summary: "killed",
        reason: playername + " is out. Think of a fun story.",
        createdAt: moment().format(), // current time
        game: Session.get("gameID"), //get gameID for chat reference
    });
  }
}

function communityNews(playerName)
{
  var game = getCurrentGame();
  Meteor.subscribe('news',game._id);
  if(game.global)
  {
    News.insert({
        name: playerName,
        summary: "Voted",
        reason: "The town was unanimous " + playerName + " has left town.",
        createdAt: moment().format(), // current time
        game: Session.get("gameID"), //get gameID for chat reference
        });
  }
  else
  {
     News.insert({
      name: playerName,
      summary: "Voted",
      reason: playerName + " is out.",
      createdAt: moment().format(), // current time
      game: Session.get("gameID"), //get gameID for chat reference
      });
  }
}

function assignRoles(players)
{
  var game = getCurrentGame();
  var totalPlayers = players.length;
  var totalMafia = Math.floor(Math.sqrt(totalPlayers));
  var colours = ['sms_01','sms_02','sms_03','sms_04','sms_05',
  'sms_06','sms_07','sms_08','sms_09','sms_10',
  'sms_11','sms_12','sms_13','sms_14','sms_15',
  'sms_16','sms_17','sms_18','sms_19','sms_20'];

  if(game.global == false)
  {
    var narr = 1;
  }
  else{
    var narr = 0;
  }
  if(totalPlayers >= 9 )
  {
    var totalInspector = 1;
    Games.update(Session.get("gameID"), {$set: {isInspector: true}});
   // var totalDoctor = 1;
  }
  else
  {
    var totalInspector = 0;
  //  var totalDoctor = 0;
  }
  var totalCivilian = totalPlayers - totalMafia - totalInspector - narr;

  var mafia = createCustomArray("mafioso",totalMafia);
 // var doctor = createCustomArray("doctor",totalDoctor);
  var narrator = createCustomArray("narrator",narr);
  var inspector = createCustomArray("inspector",totalInspector);
  var civilian = createCustomArray("civilian",totalCivilian);
  var roleList = mafia.concat(inspector,civilian,narrator);
  var role = null;
  var shuffled_roles = shuffleArray(roleList);
  players.forEach(function(player){
    role = shuffled_roles.pop();
    colour = colours.pop();
   Players.update(player._id, {$set: {role: role,colour: colour}});
 });

}
function updateScroll() 
{
	if($('#chat_sms_display')[0].scrollHeight > $('#chat_sms_display').height())
	{
	  $("#chat_sms_display").animate({ 
	    scrollTop: $('#chat_sms_display')[0].scrollHeight
	  }, 200);
	}
}

function leave()
{
  Session.set('urlAccessCode', null);
  Session.set("gameID", null);
  Session.set("isHost", null);
  Session.set("playerID", null);
  Session.set('urlCode', "/");
  Session.set("colour", 'sms_01');
  var player = getCurrentPlayer();
  if(player){
    Players.remove(player._id);
  }
  Session.set("template_select","start_screen");
}
function kill_game()
{
  var player = getCurrentPlayer();

  if (player){
    Players.remove(player._id);
  }
  location.reload();
}
function reset_user()
{
  Session.set('urlAccessCode', null);
  Session.set("gameID", null);
  Session.set("playerID", null);
  Session.set("playerName", null);
  Session.set("colour", null);
  Session.set('urlCode', "/");
  Session.set("playerID", null);
}
  //evanbrumley Spyfall
  function trackUrlState() 
    {
      var accessCode = null;
      var game = getCurrentGame();
     
      if (game){
        accessCode = game.accessCode;
      } else {
        accessCode = Session.get('urlAccessCode');
      }
      var currentURL = '/';
      if (accessCode){
        currentURL += accessCode+'/';
      }
      window.history.pushState(null, null, currentURL);
    }
    Tracker.autorun(trackUrlState);

  Tracker.autorun(stateMachine);
/*------------------------------End Functions----------------*/


Template.main_menu.helpers({
    pageSelect: function(){
    return Session.get('template_select')
  },
});

/*--------------------------Start_screen---------------------*/

  Template.start_screen.events({
    'click #create_game': function () 
    {
      Session.set('template_select', 'create_game');
    },
    'click #join_game': function () 
    {
      Session.set('template_select', 'join_game');
    }
  });

/*--------------------------Create_Game---------------------*/
Template.create_game.helpers({
  isLoading: function() {
    return Session.get('loading');
  }
});

  Template.create_game.events({
    'click #back': function () 
    {
      Session.set('template_select', 'start_screen');
    },
    'click #submit': function (event) 
    {
      event.preventDefault();
      Session.set("isHost", true);
      var playerName = $('#name').val();
      var pass = $('#pass').val();
      if(!playerName || !pass)
      {
        FlashMessages.sendInfo("Please fill out all fields");
        return false;
      }
      pass = pass.trim();
      playerName = playerName.trim();

      var game = generateNewGame();
      var player = generateNewPlayer(game, playerName, pass);
      Meteor.subscribe('games', game.accessCode);
      Session.set("loading", true);

      Meteor.subscribe('players', game._id, function onReady()
      {
        Session.set("loading", false);
        Session.set("gameID", game._id);
        Session.set("message_check", moment().format());
        Session.set("playerID", player._id);
        Session.set("playerName",player.name);
        Session.set("template_select", "queue_list");
    });
  }
  });

  /*--------------------------Join Game---------------------*/
  Template.join_game.helpers({
    isLoading: function() {
      return Session.get('loading');
    },
    hasUrlCode: function(){
      if(Session.get('urlCode') != "/")
      {
        return Session.get('urlCode');
      }
    }
  });

  Template.join_game.events({
    'click #back': function () 
    {
      leave();
    },
    'click #submit': function (event) 
    {
      event.preventDefault();

      var accessCode = $('#accessCode').val();
      var playerName = $('#name').val();
      var pass = $('#pass').val();
      if (!playerName || !pass) {
      FlashMessages.sendInfo("Please fill out all fields");
      return false;
    }

    accessCode = accessCode.trim();
    accessCode = accessCode.toLowerCase();

    pass = pass.trim();
    playerName = playerName.trim();

    Session.set("loading", true);

    Meteor.subscribe('games', accessCode, function onReady(){
      Session.set("loading", false);

      var game = Games.findOne({
        accessCode: accessCode
      });
     
      if (game) 
      {

        Session.set("isHost", false);
         var players = Players.find({gameID: game._id}).fetch();
          if(players.length >= 20){
            FlashMessages.sendError("Game is full");
            return;
          }
          Meteor.subscribe('news',game._id);
          //if first time joining
        if(game.state == "waitingForPlayers")
        {
          Session.set("loading", true);
          Meteor.subscribe('players',game._id,  function onReady(){
          Session.set("loading", false);
          player = generateNewPlayer(game, playerName, pass);
          Session.set('urlAccessCode', null);
          Session.set("gameID", game._id);
          Session.set("message_check", moment().format());
          Session.set("playerID", player._id);
          Session.set("playerName",player.name);
          });
        }
        else
          //if game in progress
        {
          Session.set("loading", true);
          Meteor.subscribe('players', game._id, function onReady()
          {
            Session.set("loading", false);
            var oldPlayer = Players.findOne({'gameID': game._id,'name': playerName,'pass': pass}, {});
            if(oldPlayer)
            {
              Session.set('urlAccessCode', null);
              Session.set("gameID", game._id);
              Session.set("playerID", oldPlayer._id);
              Session.set("message_check", moment().format());
              Session.set("playerName",oldPlayer.name);
            }
            else
            {
              FlashMessages.sendError("No player found with that information");
              Session.set("loading", false);
            }
          });
        }
      }
      else
      {
        Session.set("loading", false);
        FlashMessages.sendError("invalid access code");
      }
    });
    }
    //end event
  });

  /*--------------------------Queue---------------------*/
  Template.queue_list.helpers({
    game: function(){
      return getCurrentGame();
    },
    player: function(){
      return getCurrentPlayer();
    },
    isLoading: function() {
      return Session.get('loading');
    },
    isHost: function(){
      if(Session.get('isHost'))
      {
        return true;
      }
      else
      {
        return false;
      }
    },
    minPlayer: function(){
      var game = getCurrentGame();
      var players = Players.find({'gameID': game._id}, {}).fetch();
      if(players.length >= 5)
      {
        return "enabled";
      }
      else
      {
        return "disabled";
      }
    },
    players: function(){
      var game = getCurrentGame();
      var currentPlayer = getCurrentPlayer();

      if (!game) {
        return null;
      }
      var players = Players.find({'gameID': game._id}, {'sort': {'createdAt': 1}}).fetch();

      players.forEach(function(player){
        if (player._id === currentPlayer._id){
            Players.update(player._id, {$set: {isCurrent: true}});
        }
        if(player.role == "mafioso")
          {
            Players.update(player._id, {$set: {isMafia: true}});
          }
        if(player.role == "narrator")
          {
            Players.update(player._id, {$set: {isNarrator: true}});
          }
      });
      return players;
    },
    accessLink: function () 
    {
      return getAccessLink();
    }
  });

Template.queue_list.events({
    'click #leave': function () 
    {
      leave();
    },
    'click .remove': function (event) 
    {
      if(Session.get('isHost')){
        var player = getCurrentPlayer();
        var removePlayer = event.target.id;
        if(removePlayer !== player._id)
        {
          Players.remove(removePlayer);
        }
      }
    },
    'change #global' : function (){
       var game = getCurrentGame();
       Games.update(game._id, {$set: {global: true}});
   },
   'change #local' : function (){
      var game = getCurrentGame();
       Games.update(game._id, {$set: {global: false}});
   },
       'click #start-game': function () 
    {
      var game = getCurrentGame();
      var players = Players.find({'gameID': game._id}, {'sort': {'createdAt': 1}}).fetch();
      assignRoles(players);
      Games.update(game._id, {$set: {state: 'day'}});
    },
});

/*--------------------------Day---------------------*/
  Template.day.helpers({
    time: function(){
      var game = getCurrentGame();
      var dayString = game.gameTime + " " + game.day.toString();
      return dayString;
    },
    //briefing
    role: function(){
      var role = getCurrentPlayer();
      return role.role;
    },
    check_votes: function(){
    	var game = getCurrentGame();
    	var checkvote = Session.get('check_votes');
    	return Players.find({'gameID': game._id, 'voteCast':checkvote}, {}).fetch();
    },
    isMobile: function(){
     if(window.innerWidth < 994){
         return true;
      }
      else{
        return false;
      }
    },
    myName: function(){
      var role = getCurrentPlayer();
      return role.name;
    },
    isMafia: function(){
      var player = getCurrentPlayer();
      return player.isMafia;
    },
    updateScroll: function(){
        updateScroll();
    },
    roleDescription: function(){
      var player = getCurrentPlayer();
      if(player.role === 'mafioso')
      {
        return "During the day you must blend in with the rest and avoid being voted out. During the night, all Mafioso must decide together who to off.";
      }
      else if(player.role === 'civilian')
      {
        return "During the day all civilians must decide to vote someone out. You will need more than half of everyones votes. Good luck.";
      }
      else if(player.role === 'narrator')
      {
        return "It is your job to dictate the game.";
      }
      else if(player.role === 'inspector')
      {
        return "During the night you have the opportunity to investigate another player's role. Choose carefully.";
      }
      else if(player.roler === 'doctor')
      {
        return "During the night you have the opportunity to save one player. Including yourself."
      }
    },
    global: function(){
      var game = getCurrentGame();
      var player = getCurrentPlayer();

      if(!game.global)
      {
        if(player.isNarrator == true)
        {
          return true;
        }
        else
        {
          return false;
        }
      }
      else
      {
        return true;
      }
    },

    enabled: function(){
      var game = getCurrentGame();
      return game.global;
    },
    //visiblity per player role
    access: function(){
      var game = getCurrentGame();
      var player = getCurrentPlayer();
      if(game.state == "day")
      {
        return true;
      }
      else if(game.state == "night" && player.isMafia == true)
      {
        return true;
      }
      else if(game.state == "night" && player.isMafia == false){
        return false;
      }
      else if(game.state == "inspection" && player.role == "inspector")
      {
        return true;
      }
      else if(game.state == "inspection" && player.role != "inspector")
      {
        return false;
      }
      else if(game.state == "medic" && player.role == "doctor")
      {
        return true;
      }
      else if(game.state == "medic" && player.role != "doctor")
      {
        return false;
      }
      else
      {
        return false;
      }
    },
    messageNotification: function(){
      var game = getCurrentGame();
      var chat_messages = Chat.find({'game': game._id, createdAt: {$gt: Session.get("message_check")}}, {}).fetch();
      if(chat_messages.length > 0){
        return true;
      }
      else
      {
        return false;
      }
    },
    otherMafia: function(){
      var game = getCurrentGame();
      var players = Players.find({'gameID': game._id,'isMafia':true}, {}).fetch();
      return players;
    },
    isAlive: function(){
      var alive = getCurrentPlayer();
      return alive.alive;
    },
    civilians: function(){
      var game = getCurrentGame();
      var Civilians = Players.find({'gameID': game._id,'role':'civilian'}, {}).fetch();
      return Civilians.length;
    },
    mafioso: function(){
      var game = getCurrentGame();
      var mafioso = Players.find({'gameID': game._id,'isMafia':true}, {}).fetch();
      return mafioso.length;
    },
    inspector: function(){
      var game = getCurrentGame();
      var inspect = Players.find({'gameID': game._id,'role':'inspector'}, {}).fetch();
      return inspect.length;
    },
    players: function(){
      var game = getCurrentGame();
      var currentPlayer = getCurrentPlayer();
      var players = Players.find({'gameID': game._id, 'isNarrator':false}, {'sort': {'votes': -1}}).fetch();
      return players;
    },
    //chat
    chat: function(){
      return Chat.find({"game":Session.get("gameID")}, {sort: {createdAt: +1}});
    },
    news: function(){
      return News.find({"game":Session.get("gameID")}, {sort: {createdAt: -1}});
    },
    isInspector: function(){
      var player = getCurrentPlayer();
      if(player.role == "inspector"){
        return true;
      }else{
        return false;
      }
    },
  });

  Template.day.events({
    //voting
    'click .whoVoted' :function(event){
    	var playerID = event.target.id;
    	Session.set('check_votes', playerID);
    },
    'click .vote' :function(event){
      var myVote = event.target.id;
      var votedPlayer = getVotedPlayer(myVote);
      var player = getCurrentPlayer();
      var game = getCurrentGame();
      //day and night votes
      if(game.state == "day" || game.state == "night")
      {
        if(myVote == player._id || player.alive == false || player.role == "narrator" || player.voteCast === myVote || votedPlayer.alive == false || votedPlayer.role == "narrator")
        {
          // don't vote for yourself dummy
        }
        else if(player.voteCast == null)
        {
          //initialize vote
        Players.update(player._id, {$set: {voteCast: myVote}});
        Session.set('myVote', myVote);
        //store vote as session variable to negate it later on
        Players.update(votedPlayer._id, {$set: {votes: votedPlayer.votes + 1}});
        }
        else if(player.voteCast !== myVote)
        {
          //player changes vote
          //negate last vote
          var lastVote = getVotedPlayer(Session.get('myVote'));
          Players.update(Session.get('myVote'), {$set: {votes: lastVote.votes -1}});
          Session.set('myVote', myVote);

          // add new vote
          Players.update(votedPlayer._id, {$set: {votes: votedPlayer.votes + 1}});
          Players.update(player._id, {$set: {voteCast: myVote}});
        }
      }

      //special phases votes
      else if(game.state == "inspection")
      {
        if(myVote == player._id || player.alive == false || player.voteCast === myVote || votedPlayer.alive == false || votedPlayer.role == "narrator")
        {
          // don't vote for yourself dummy
        }
        else
        {
          alert(votedPlayer.name + " | " + votedPlayer.role);
          var isDoctorAlive = Players.find({'gameID': game._id,  'alive': true, 'role': 'doctor'},{}).fetch();
          if(isDoctorAlive.length == 0)
          {
            Games.update(game._id, {$set: {state: 'night'}});
          }
          else
          {
            Games.update(game._id, {$set: {state: 'medic'}});
          }
        }
      }
      //add more role phases here via else if
      checkVotes(game.state);
    },

    //chat
    "submit .new-message": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
      var player = getCurrentPlayer();
      var text = event.target.text.value;
      if(text == null || text == "" || text == " ")
      {
        return false;
      }
      Chat.insert({
        text: text,
        createdAt: moment().format(), // current time
        game: Session.get("gameID"), //get gameID for chat reference
        owner: Session.get("playerID"),  // _id of user
        colour: player.colour,
        username: Session.get("playerName")  // username of user
      });
      updateScroll();
      Session.set("message_check", moment().format());
      // Clear form
      event.target.text.value = "";
      }
  });

  Template.game_over.helpers({
    players: function(){
      var game = getCurrentGame();
      var players = Players.find({'gameID': game._id}, {'sort': {'name': -1}}).fetch();
      return players;
    },
    winner: function(){
      var winner = getCurrentGame();
      return winner.winner;
    },
    special: function(){
      var game = getCurrentGame();
      return game.special;
    }
  });
 
/*--------------------------Renders---------------------*/
  Template.main_menu.rendered = function(){
    
  };

  Template.queue_list.rendered = function(){
    $(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip({placement:'right'}); 
    });
  };

  Template.day.rendered = function(){
    var game = getCurrentGame();
    var scrolled = false;
    var heights = window.innerHeight;
    var row_H = $('.row').height();
    var smsField_H = $('.new-message').height();
    var shown_tab = false;
    
    if(window.innerWidth <= 500){
       document.getElementById("chat_sms_display").style.height = heights-row_H-60 + "px";
    }
    else if(window.innerWidth < 994 && window.innerWidth > 500){
       document.getElementById("chat_sms_display").style.height = heights-row_H-60 + "px";
    }
    else{
      document.getElementById("chat_sms_display").style.height = (heights - (heights / 4))-row_H-75 + "px";
    }
   if(game.global)
      {
    setInterval(function(){
      if(shown_tab){
      var divHeight = $('#chat_sms_display').height();
      var scrollHeight = $('#chat_sms_display').prop('scrollHeight');  
      var scrolledpx = parseInt($("#chat_sms_display").scrollTop()); 
      if(($("#chat_sms_display").scrollTop()+divHeight) > (scrollHeight-150)) {
          Session.set("message_check", moment().format());
          updateScroll();
        }else{
          //do nothing
        }
      }
    },500);
  }
    window.onresize = function(event) {
      setTimeout(function() {
      var heights = window.innerHeight;
      var row_H = $('.row').height();
      var smsField_H = $('.new-message').height();
       if(window.innerWidth <= 500){
       document.getElementById("chat_sms_display").style.height = heights-row_H-30 + "px";
      }
      else if(window.innerWidth < 994 && window.innerWidth > 500){
         document.getElementById("chat_sms_display").style.height = heights-row_H-30 + "px";
      }else{
        document.getElementById("chat_sms_display").style.height = heights-row_H-75 + "px";
      }
    },150);
    }

    $('a[update-time="up"]').on('shown.bs.tab', function (e) {
      shown_tab = true;
      Session.set("message_check", moment().format());
      updateScroll();
    });

    $('a[update-time="down"]').on('shown.bs.tab', function (e) {
      shown_tab = false;
    });

    var game = getCurrentGame();
    Meteor.subscribe('chat',game._id);
    $('.nav-tabs a').click(function(){
        $(this).tab('show');
    });

    $(document).ready(function(){
      $('[data-toggle="tooltip"]').tooltip({placement:'right'}); 
    });
  };

  Template.game_over.rendered = function(){
    window.setTimeout(kill_game, 30000);
  };

  Template.join_game.rendered = function(){
    $('input[type=text][name=name]').tooltip({
    placement: "top",
    trigger: "focus"
  });
      $('input[type=text][name=pass]').tooltip({
    placement: "bottom",
    trigger: "focus"
  });
  };
  Template.start_screen.rendered = function()
    {
      reset_user();
    };

  Template.create_game.rendered = function(){

    $('input[type=text][name=name]').tooltip({
    placement: "top",
    trigger: "focus"
  });
      $('input[type=text][name=pass]').tooltip({
    placement: "bottom",
    trigger: "focus"
  });
  };