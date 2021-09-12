const Discord=require("discord.js");
const Game=require("../utils/Game");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({client,message})=>{
    if(!client.games.has(message.author.id))return message.reply({content:"You are not hosting a game."});
    new Game.Delete({client,gameId:message.author.id});
  },
  name:"stop",
  description:"To stop the playing game",
  category:"match",
  shortRules:"To stop the playing game",
  exemples:`\`${process.env.BOT_PREFIX}stop\` <- no args required`,
  cooldown:1e3
};