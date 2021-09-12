const Discord=require("discord.js");
module.exports={
  event:"gameDelete",
  once:false,
  disabled:false,
  /**
   * @param {Discord.Client} client 
   * @param {String} gameId 
   */
  func:async(client,gameId)=>{
    const game=client.games.get(gameId);
    game.players.forEach(playerId=>{
      client.inGame.delete(playerId);
    });
    const channel=client.channels.cache.get(game.channelId);
    client.games.delete(gameId);
    channel.send(`→ The match has stopped`);
  }
};