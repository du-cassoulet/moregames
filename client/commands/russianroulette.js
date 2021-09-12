const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({message})=>{
    const lobby=new Lobby({
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:6,
      minPlayers:2,
      message:message,
      rules:module.exports.description
    });
    lobby.start(async(players,botMessage)=>{
      const gameStart=Date.now();
      botMessage.delete();
      const shootedPlayer=players[Math.floor(Math.random()*players.length)];
      new EndMessage({
        channel:message.channel,
        game:module.exports.gameName,
        gameStart:gameStart,
        hostId:message.author.id,
        losers:players.filter(playerId=>playerId==shootedPlayer),
        winners:players.filter(playerId=>playerId!=shootedPlayer),
        reason:`${message.guild.members.cache.get(shootedPlayer).user.username} died`,
        rules:module.exports.description
      }).send();
    });
  },
  name:"russianroulette",
  aliases:["rr"],
  description:"There is only one bullet in the six-shooter, the one who takes the bullet has lost!",
  category:"game",
  shortRules:"To play to the russian roulette",
  exemples:`\`${process.env.BOT_PREFIX}russianroulette\` <- no args required`,
  gameName:"Russian roulette",
  icon:"https://i.imgur.com/f3YrhkR.png",
  cooldown:1.5e4
};