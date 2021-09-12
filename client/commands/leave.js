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
  func:async({client,message,args})=>{
    if(client.games.has(message.author.id))return message.reply({content:"You can't leave a game that you are hosting."});
    if(!client.inGame.has(message.author.id))return message.reply({content:"You are not in a game."});
    new Game.RemovePlayer({client,userId:message.author.id});
  },
  name:"leave",
  description:"To leave a game",
  category:"match",
  shortRules:"To leave a game",
  exemples:`\`${process.env.BOT_PREFIX}leave\` <- no args required`,
  cooldown:1e3
};