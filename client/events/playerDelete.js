const Discord=require("discord.js");
const EndMessage=require("../utils/EndMessage");
module.exports={
  event:"playerDelete",
  once:false,
  disabled:false,
  /**
   * @param {Discord.Client} client 
   * @param {String} userId 
   */
  func:async(client,userId)=>{
    const gameId=client.inGame.get(userId);
    const game=client.games.get(gameId);
    const channel=client.channels.cache.get(game.channelId);
    game.players.splice(game.players.indexOf(userId),1);
    client.games.set(gameId,game);
    client.inGame.delete(userId);
    if(game.players.length<game.minPlayers&&!game.starting){
      new EndMessage({
        channel:channel,
        game:game.name,
        gameStart:game.start,
        hostId:gameId,
        losers:[userId],
        winners:game.players.filter(playerId=>playerId!=userId),
        reason:`${channel.guild.members.cache.get(userId).user.username} left the game`,
        rules:client.commands.get(game.name).description
      }).send();
      client.games.delete(gameId);
    };
    const leaveMessage=await channel.send(`→ ${channel.guild.members.cache.get(userId).user.username} left the game`);
    setTimeout(()=>{
      if(leaveMessage.deletable)leaveMessage.delete();
    },2e3);
  }
};