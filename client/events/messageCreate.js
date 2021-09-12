const Discord=require("discord.js");
const utils=require("../utils/utils");
const db=require("quick.db");
const ms=require("ms");
const createUser=require("../utils/createUser");
const cooldown=new Set();
module.exports={
  event:"messageCreate",
  once:false,
  disabled:false,
  /**
   * @param {Discord.Client} client 
   * @param {Discord.Message} message 
   */
  func:async(client,message)=>{
    if(message.author.bot||!message.guild)return;
    const prefix=db.get(`${message.guild.id}-prefix`);
    // console.log(message.guild.emojis.cache.map(emoji=>`<${emoji.animated?"a":""}:${emoji.name}:${emoji.id}>`));
    if(!message.content.startsWith(prefix))return;
    const args=message.content.slice(prefix.length).trim().split(/ +/g);
    const command=args.shift().toLowerCase();
    if(client.commands.has(command)){
      playCommand(client.commands.get(command));
    }else if(client.aliases.has(command)){
      playCommand(client.commands.get(client.aliases.get(command)));
    };
    function playCommand(command){
      if(cooldown.has(`${message.author.id}${command.name}`))return message.reply({content:`:stopwatch: You are in a cooldown, wait **${ms(command.cooldown,{long:true})}** before you can play this command back.`});
      cooldown.add(`${message.author.id}${command.name}`);
      setTimeout(()=>cooldown.delete(`${message.author.id}${command.name}`),command.cooldown);
      createUser({client,userId:message.author.id});
      utils.addCommand(command.name,command.category=="game");
      global.logger.status(`Command "${command.file}" is now running.`);
      if(!db.has("commandnumber"))db.set("commandnumber",1);
      else db.add("commandnumber",1);
      return command.func({client,message,args});
    };
  }
};