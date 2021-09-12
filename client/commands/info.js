const Discord=require("discord.js");
const db=require("quick.db");
const byteSize=require("byte-size");
const ms=require("ms");
const utils=require("../utils/utils");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({client,message})=>{
    const images={
      weight:db.get(`images.weight`)||0,
      number:db.get(`images.number`)||0
    };
    var commands=[];
    Object.entries(db.get("commands.notGame")).forEach(command=>{
      if(command[0]=="undefined")return;
      return commands.push({
        name:command[0],
        playTime:command[1]
      });
    });
    commands=commands.sort((a,b)=>b.playTime-a.playTime).slice(0,5);
    var games=[];
    Object.entries(db.get("commands.game")).forEach(game=>{
      if(game[0]=="undefined")return;
      return games.push({
        name:game[0],
        playTime:game[1]
      });
    });
    games=games.sort((a,b)=>b.playTime-a.playTime).slice(0,5);
    const used=process.memoryUsage().heapUsed/1024/1024;
    const embed=new Discord.MessageEmbed();
    embed.setAuthor(`${client.user.username}'s informations`,client.user.displayAvatarURL());
    embed.setDescription(`🔗 [Invite me](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=395137379393&scope=bot) - [Join me](https://discord.gg/xrZcgVGYny)`);
    embed.setColor(utils.userStyle(message.author.id).main_color);
    embed.addField("Game statistics",`**Most played games:**\n${games.map((game,index)=>`**${numToQual(index+1)}.** ${game.name} (${game.playTime})`).join("\n")||"No statistics"}`,true);
    embed.addField("Command statistics",`**Most played commands:**\n${commands.map((command,index)=>`**${numToQual(index+1)}.** ${command.name} (${command.playTime})`).join("\n")||"No statistics"}`,true);
    embed.addField(`Global statistics`,
      `🌐 Servers: **${client.guilds.cache.size}**\n👥 Users: **${client.users.cache.size}**\n🗨️ Channels: **${client.channels.cache.filter(channel=>channel.type=="GUILD_TEXT").size}**\n💻 Memory usage: **${utils.numberWithCommas(Math.round(used*100)/100)}MB**\n📡 **${utils.numberWithCommas(db.get("commandnumber")||0)}** commands\n🕙 **${ms(db.has("gametimespent")?db.get("gametimespent"):0,{long:true})}** spent playing\n🤖 Uptime: **${ms(client.uptime,{long:true})}**\n🏓 Ping: **${client.ws.ping}ms**\n🖼️ **${utils.numberWithCommas(images.number)} images generated**\n📤 **${byteSize(images.weight).toString().replace(/ /g,"")}** of images uploaded`
    );
    message.channel.send({embeds:[embed]});
    function numToQual(val){
      if(val==1)return"1st";
      else if(val==2)return"2nd";
      else if(val==3)return"3nd";
      else if(val>3)return`${val}th`;
    };
  },
  name:"info",
  aliases:["infos"],
  description:"To get some infos for the bot",
  category:"infos",
  shortRules:"To get some infos for the bot",
  exemples:`\`${process.env.BOT_PREFIX}\`info`,
  cooldown:3e3
};