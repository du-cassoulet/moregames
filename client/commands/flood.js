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
      maxPlayers:3,
      message:message,
      minPlayers:1,
      rules:module.exports.description,
      gamemodes:[
        {
          label:"Easy",
          description:"Board: 7x7, 12 trys, 5 colors",
          emoji:"❤️"
        },
        {
          label:"Medium",
          description:"Board: 10x10, 24 trys, 6 colors",
          emoji:"❤️‍🩹"
        },
        {
          label:"Hard",
          description:"Board: 14x14, 32 trys, 7 colors",
          emoji:"❤️‍🔥"
        },
        {
          label:"Impossible",
          description:"Board: 14x14, 46 trys, 9 colors",
          emoji:"💔"
        }
      ]
    });
    lobby.start(async(players,botMessage,gamemode)=>{
      const gameStart=Date.now();
      if(gamemode=="easy"){
        var mapborder=7;
        var emojis=["🟥","🟧","🟨","🟩","🟦"];
        var avaliableTurns=12;
      }else if(gamemode=="medium"){
        var mapborder=10;
        var emojis=["🟥","🟧","🟨","🟩","🟦","🟪"];
        var avaliableTurns=24;
      }else if(gamemode=="hard"){
        var mapborder=14;
        var emojis=["🟥","🟧","🟨","🟩","🟦","🟪","🟫"];
        var avaliableTurns=32;
      }else if(gamemode=="impossible"){
        var mapborder=14;
        var emojis=["🟥","🟧","🟨","🟩","🟦","🟪","🟫","⬛","⬜"];
        var avaliableTurns=46;
      }else{
        var mapborder=10;
        var emojis=["🟥","🟧","🟨","🟩","🟦","🟪"];
        var avaliableTurns=24;
      };
      const randomEmoji=()=>emojis[Math.floor(Math.random()*emojis.length)];
      const map=[];
      for(let y=0;y<mapborder;y++){
        const row=[];
        for(let x=0;x<mapborder;x++)row.push(randomEmoji());
        map.push(row);
      };
      function colorMap(emoji){
        colorAllAround(0,0,emoji);
        function colorAllAround(x,y,emoji){
          const oldColor=map[y][x];
          map[y][x]=emoji;
          if(map[y][x+1]==oldColor)colorAllAround(x+1,y,emoji);
          if(map[y][x-1]==oldColor)colorAllAround(x-1,y,emoji);
          if(map[y+1]&&map[y+1][x]==oldColor)colorAllAround(x,y+1,emoji);
          if(map[y-1]&&map[y-1][x]==oldColor)colorAllAround(x,y-1,emoji);
        };
      };
      function checkEnd(){
        var sameColorEverywhere=true;
        map.forEach(row=>row.forEach(color=>{
          if(color!=map[0][0])sameColorEverywhere=false;
        }));
        if(sameColorEverywhere){
          new EndMessage({
            channel:message.channel,
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            winners:players,
            reason:"The puzzle got completed",
            rules:module.exports.description
          }).send();
          return true;
        }else if(!avaliableTurns){
          new EndMessage({
            channel:message.channel,
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            losers:players,
            reason:"Turns number exceeded",
            rules:module.exports.description
          }).send();
          return true;
        }else return false;
      };
      botMessage.edit({
        content:`${players.length>1?`${message.guild.members.cache.get(utils.loopIdGetter(players,avaliableTurns)).user}'s turn\n`:""}**${avaliableTurns}** turns remaining\n${map.map(row=>row.join("")).join("\n")}`,
        embeds:[],
        components:[]
      });
      emojis.forEach(emoji=>botMessage.react(emoji));
      const collector=botMessage.createReactionCollector({
        filter:(reaction,user)=>emojis.includes(reaction.emoji.name)&&players.includes(user.id),
        time:6e5
      });
      collector.on("collect",(reaction,user)=>{
        const curPlayer=utils.loopIdGetter(players,avaliableTurns);
        reaction.users.remove(user.id);
        if(user.id!=curPlayer)return;
        avaliableTurns--;
        if(reaction.emoji.name!=map[0][0])colorMap(reaction.emoji.name);
        botMessage.edit({content:`${players.length>1?`${message.guild.members.cache.get(utils.loopIdGetter(players,avaliableTurns)).user}'s turn\n`:""}**${avaliableTurns}** turns remaining\n${map.map(row=>row.join("")).join("\n")}`});
        const end=checkEnd();
        if(end)collector.stop();
      });
    });
  },
  name:"flood",
  description:"Click on the colors, all similar colors will change, if the board becomes a solid color before the 24 turns you have won the game!",
  category:"game",
  shortRules:"To play to the flood",
  exemples:`\`${process.env.BOT_PREFIX}flood\` <- no args required`,
  gameName:"Flood",
  icon:"https://i.imgur.com/UtW9HZX.png",
  cooldown:1.5e4
};