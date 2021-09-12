const Discord=require("discord.js");
module.exports={
  event:"ready",
  once:false,
  disabled:false,
  /**
   * @param {Discord.Client} client 
   */
  func:client=>{
    client.user.setActivity(`${process.env.BOT_PREFIX}help | ${process.env.BOT_PREFIX}infos`,{type:"WATCHING"});
  }
};