const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const utils=require("../utils/utils");
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
      maxPlayers:15,
      message:message,
      minPlayers:2,
      rules:module.exports.description
    });
    lobby.start(async(players,botMessage)=>{
      const startDate=Date.now();
      var inGamePlayers=[...players];
      inGamePlayers=inGamePlayers.map(playerId=>{
        return{id:playerId,hasBomb:false}
      });
      inGamePlayers[Math.floor(Math.random()*inGamePlayers.length)].hasBomb=true;
      const itemsPerRow=5;
      const rowNumber=Math.ceil(inGamePlayers.length/itemsPerRow);
      var exploded=false;
      botMessage.components=[];
      for(let i=0;i<rowNumber;i++){
        const row=new Discord.MessageActionRow();
        const buttons=[];
        inGamePlayers.slice(i*itemsPerRow,i*itemsPerRow+itemsPerRow).forEach(player=>{
          buttons.push(
            new Discord.MessageButton()
            .setCustomId(player.id)
            .setStyle("SECONDARY")
            .setLabel(message.guild.members.cache.get(player.id).user.username)
          );
        });
        row.addComponents(...buttons);
        botMessage.components.push(row);
      };
      botMessage.edit({
        content:`\\💣 Someone threw a bomb to ${message.guild.members.cache.get(inGamePlayers.find(player=>player.hasBomb).id).user} !`,
        embeds:[
          new Discord.MessageEmbed()
          .setColor(utils.userStyle(message.author.id).main_color)
          .setDescription(`**Quick rules:**\nThrow the bomb by clicking on a button, if the bomb explodes in your hands, the game is lost!\n\n${inGamePlayers.map(player=>`- ${message.guild.members.cache.get(player.id).user} ${player.hasBomb?"\\💣":""}`).join("\n")}`)
          .setFooter("Click on a button")
        ],
        components:botMessage.components
      });
      setTimeout(()=>{
        if(exploded)return;
        exploded=true;
        return new EndMessage({
          hostId:message.author.id,
          channel:message.channel,
          game:module.exports.gameName,
          rules:module.exports.description,
          losers:inGamePlayers.filter(player=>player.hasBomb).map(p=>p.id),
          winners:inGamePlayers.filter(player=>!player.hasBomb).map(p=>p.id),
          reason:`The bomb exploded`,
          gameStart:startDate
        }).send();
      },Math.floor(Math.random()*1.5e4)+3e4);
      createCollecor();
      function createCollecor(){
        const collector=botMessage.createMessageComponentCollector({
          filter:button=>button.user.id==inGamePlayers.find(player=>player.hasBomb).id,
          time:Math.floor(Math.random()*6e3)+3e3,
          max:1
        });
        collector.on("collect",async button=>{
          button.deferUpdate();
          const userToPass=button.customId;
          inGamePlayers.find(player=>player.id==button.user).hasBomb=false;
          inGamePlayers.find(player=>player.id==userToPass).hasBomb=true;
          botMessage.edit({
            content:`\\💣 Someone threw a bomb to ${message.guild.members.cache.get(inGamePlayers.find(player=>player.hasBomb).id).user} !`,
            embeds:[
              new Discord.MessageEmbed()
              .setColor(utils.userStyle(message.author.id).main_color)
              .setDescription(`**Quick rules:**\nThrow the bomb by clicking on a button, if the bomb explodes in your hands, the game is lost!\n\n${inGamePlayers.map(player=>`- ${message.guild.members.cache.get(player.id).user} ${player.hasBomb?"\\💣":""}`).join("\n")}`)
              .setFooter("Click on a button")
            ],
            components:botMessage.components
          });
          createCollecor();
        });
        collector.on("end",collected=>{
          if(!collected.size&&!exploded){
            exploded=true;
            return new EndMessage({
              hostId:message.author.id,
              channel:message.channel,
              game:module.exports.gameName,
              rules:module.exports.description,
              losers:inGamePlayers.filter(player=>player.hasBomb).map(p=>p.id),
              winners:inGamePlayers.filter(player=>!player.hasBomb).map(p=>p.id),
              reason:`The bomb exploded`,
              gameStart:startDate
            }).send();
          };
        });
      };
    });
  },
  name:"passthebomb",
  aliases:["pdb"],
  description:"Someone throws a bomb at you that is about to explode, so you decide to throw it at the nearest person to get rid of the bomb!",
  category:"game",
  shortRules:"To play to the pass the bomb game",
  exemples:`\`${process.env.BOT_PREFIX}passthebomb\` <- no args required`,
  gameName:"Pass the bomb",
  icon:"https://i.imgur.com/GrZA6SO.png",
  cooldown:1.5e4
};