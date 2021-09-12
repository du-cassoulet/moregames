class Create{
  constructor({client,gameId,minPlayers,channelId,gameName,gameStart,starting}){
    this.client=client;
    this.gameId=gameId;
    this.minPlayers=minPlayers;
    this.channelId=channelId;
    this.gameName=gameName;
    this.starting=starting;
    this.gameStart=gameStart;
    client.games.set(this.gameId,{
      players:[gameId],
      minPlayers:this.minPlayers,
      channelId:this.channelId,
      name:this.gameName,
      start:this.gameStart,
      starting:this.starting
    });
  };
};
class Delete{
  constructor({client,gameId}){
    this.client=client;
    this.gameId=gameId;
    client.emit("gameDelete",gameId);
  };
};
class AddPlayer{
  constructor({client,gameId,userId}){
    this.client=client;
    this.gameId=gameId;
    this.userId=userId;
    const game=client.games.get(this.gameId);
    game.players.push(userId);
    client.games.set(this.gameId,game);
    client.inGame.set(userId,gameId);
  };
};
class RemovePlayer{
  constructor({client,userId}){
    this.client=client;
    this.userId=userId;
    client.emit("playerDelete",userId);
  };
};
module.exports={Create,Delete,AddPlayer,RemovePlayer};