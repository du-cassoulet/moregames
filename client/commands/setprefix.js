const Discord=require("discord.js");
const db=require("quick.db");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({message,args})=>{
    if(!args.length||args.length>3)return message.reply({content:"You must give me a prefix of maximum 3 characters."});
    db.set(`${message.guild.id}-prefix`,args[0]);
    message.reply({content:`**${db.get(`${message.guild.id}-prefix`)}** is the new guild prefix`});
  },
  name:"setprefix",
  aliases:["sp","prefix"],
  description:"To set a new bot prefix for a server",
  category:"utility",
  shortRules:"To set a new bot prefix for a server",
  exemples:`\`${process.env.BOT_PREFIX}setprefix\` <- new prefix (max length:3)`,
  cooldown:1.5e4
};