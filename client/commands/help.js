const Discord=require("discord.js");
const utils=require("../utils/utils");
const db=require("quick.db");
const ms=require("ms");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({client,message,args})=>{
    const prefix=db.get(`${message.guild.id}-prefix`);
    if(!args.length){
      const embed=new Discord.MessageEmbed();
      embed.setColor(utils.userStyle(message.author.id).main_color);
      const games=client.commands.filter(command=>command.category=="game");
      const categories=[];
      client.commands.forEach(command=>{
        if(command.category=="game")return;
        if(categories.find(cat=>cat.name==command.category))categories.find(cat=>cat.name==command.category).commands.push(command);
        else categories.push({
          name:command.category,
          commands:[command]
        });
      });
      message.reply({content:`${client.user.username}'s help message\n\n\\🕹️ **Games:**\n${games.map(game=>`${game.gameName} \`${prefix}${game.name}\`: ${game.shortRules}`).join("\n")}\n\n\\📰 **Other categories:**\n${categories.map(cat=>`${cat.name}: (${cat.commands.map(command=>`\`${command.name}\``).join(", ")})`).join("\n")}\n\nDo ${prefix}help [<command-name>] to get some details for a specific command\nServer Invite: https://discord.gg/xrZcgVGYny`});
    }else if(client.commands.has(args[0].toLowerCase())){
      sendInfos(args[0].toLowerCase());
    }else if(client.aliases.has(args[0].toLowerCase())){
      sendInfos(client.aliases.get(args[0].toLowerCase()));
    }else return message.reply({
      content:`<:off:869978532489617458> The command ${args[0].toLowerCase()} doesn't exist.`
    });
    function sendInfos(commandName){
      const command=client.commands.get(commandName);
      const embed=new Discord.MessageEmbed();
      embed.setColor(utils.userStyle(message.author.id).main_color);
      embed.setThumbnail(command.icon);
      embed.setDescription(
        `\\🕹️ **${command.name}**${command.aliases?` [${command.aliases.join(", ")}]`:""}\n${command.description}\n\nCategory: ${command.category} - Cooldown: ${ms(command.cooldown,{long:true})}\nUsage exemples:\n${command.exemples}`
      );
      message.channel.send({embeds:[embed]});
    }
  },
  name:"help",
  description:"To get the help message",
  category:"utility",
  shortRules:"To get the help message",
  exemples:`\`${process.env.BOT_PREFIX}help\` <- list all the commands
help hangman\` <- get help for another command`,
  cooldown:3e3
};