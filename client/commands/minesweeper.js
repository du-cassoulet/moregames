const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const utils=require("../utils/utils");
const numberToText=require("number-to-text");
const emojiConvert=require("discord-emoji-converter");
require("number-to-text/converters/en-us");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:({message})=>{
    const lobby=new Lobby({
      message:message,
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:4,
      minPlayers:1,
      rules:module.exports.description,
      gamemodes:[
        {
          label:"Easy",
          description:"10 bombs are hidden in the map",
          emoji:"❤️"
        },
        {
          label:"Medium",
          description:"20 bombs are hidden in the map",
          emoji:"❤️‍🩹"
        },
        {
          label:"Hard",
          description:"30 bombs are hidden in the map",
          emoji:"❤️‍🔥"
        }
      ]
    });
    lobby.start(async(players,botMessage,gamemode)=>{
      if(gamemode=="easy")var mineNumber=10;
      else if(gamemode=="medium")var mineNumber=20;
      else if(gamemode=="hard")var mineNumber=30;
      else var mineNumber=20;
      const startDate=new Date();
      var turn=0;
      var end=false;
      const letters="abcdefghijklmnopqrstuvwxyz";
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        embeds:botMessage.embeds,
        components:botMessage.components
      });
      const emojis=["⬜","⬛","💥","🚩","⭕"];
      const map=[];
      for(let y=0;y<8;y++){
        const row=[];
        for(let x=0;x<12;x++){
          row.push(emojis[0]);
        };
        map.push(row);
      };
      const hiddenMap=[...map.map(row=>row.map(_=>emojis[1]))];
      for(let i=0;i<mineNumber;i){
        const x=Math.floor(Math.random()*map[0].length);
        const y=Math.floor(Math.random()*map.length);
        if(map[y][x]==emojis[0]&&(x&&y)){
          map[y][x]=emojis[2];
          i++;
        };
      };
      botMessage.embeds=[];
      botMessage.components=[];
      function frame(map){
        const customMap=[];
        map.forEach(row=>{
          customMap.push([...row]);
        });
        customMap.map((row,index)=>{
          row.unshift(`:${numberToText.convertToText(index+1).toLowerCase()}:`);
        });
        const letterRow=["<:N_:718506491660992735>"];
        customMap[0].forEach((_,index)=>{
          if(index-1<0)return;
          letterRow.push(`:regional_indicator_${letters[index-1]}:`);
        });
        customMap.unshift(letterRow);
        return customMap.map(row=>row.join("")).join("\n");
      };
      for(let i=0;i<5;i++){
        if(i<3){
          const row=new Discord.MessageActionRow();
          const components=[];
          for(let j=0;j<4;j++){
            components.push(
              new Discord.MessageButton().setCustomId(`${i}:${j}:${letters[i*4+j]}`).setStyle("SUCCESS")
                .setEmoji(emojiConvert.emojify(`:regional_indicator_${letters[i*4+j]}:`))
            );
          };
          row.addComponents(...components);
          if(i==0){
            row.addComponents(
              new Discord.MessageButton().setStyle("PRIMARY").setCustomId(`${i}:4:check`).setLabel("Check").setEmoji(emojis[4])
            );
          }else if(i==1){
            row.addComponents(
              new Discord.MessageButton().setStyle("PRIMARY").setCustomId(`${i}:4:spot`).setLabel("Spot").setEmoji(emojis[3])
            );
          };
          botMessage.components.push(row);
        }else{
          const row=new Discord.MessageActionRow();
          const components=[];
          for(let j=0;j<4;j++){
            components.push(
              new Discord.MessageButton().setCustomId(`${i}:${j}:${(i*4+j)-11}`).setStyle("DANGER")
                .setEmoji(emojiConvert.emojify(`:${numberToText.convertToText((i*4+j)-11).toLowerCase()}:`))
            );
          };
          row.addComponents(...components);
          botMessage.components.push(row);
        };
      };
      const content=()=>`${players.length>1?`${message.guild.members.cache.get(utils.loopIdGetter(players,turn)).user}'s turn\n\n`:""}${frame(hiddenMap)}`
      botMessage.content=content();
      refreshMessage();
      createCollector();
      function createCollector(){
        var x={bpos:[],value:undefined};
        var y={bpos:[],value:undefined};
        var option={bpos:[],value:undefined};
        const collector=botMessage.createMessageComponentCollector({
          filter:button=>button.user.id==utils.loopIdGetter(players,turn),
          time:3e5
        });
        collector.on("collect",async button=>{
          button.deferUpdate();
          var[buttonY,buttonX,value]=button.customId.split(":");
          buttonY=parseFloat(buttonY);
          buttonX=parseFloat(buttonX);
          if(letters.split("").includes(value)){
            if(x.value!=undefined){
              botMessage.components[x.bpos[1]].components[x.bpos[0]].setStyle("SUCCESS");
            };
            x.bpos=[buttonX,buttonY];
            x.value=letters.split("").indexOf(value);
            botMessage.components[buttonY].components[buttonX].setStyle("SECONDARY");
          }else if(!isNaN(value)){
            if(y.value!=undefined){
              botMessage.components[y.bpos[1]].components[y.bpos[0]].setStyle("DANGER");
            };
            y.bpos=[buttonX,buttonY];
            y.value=parseFloat(value)-1;
            botMessage.components[buttonY].components[buttonX].setStyle("SECONDARY");
          }else{
            if(option.value!=undefined){
              botMessage.components[option.bpos[1]].components[option.bpos[0]].setStyle("PRIMARY");
            };
            option.bpos=[buttonX,buttonY];
            option.value=value;
            botMessage.components[buttonY].components[buttonX].setStyle("SECONDARY");
          };
          if(x.value!=undefined&&y.value!=undefined&&option.value!=undefined){
            botMessage.components[x.bpos[1]].components[x.bpos[0]].setStyle("SUCCESS");
            botMessage.components[y.bpos[1]].components[y.bpos[0]].setStyle("DANGER");
            botMessage.components[option.bpos[1]].components[option.bpos[0]].setStyle("PRIMARY");
            collector.stop();
            playTurn(x.value,y.value,option.value);
            checkRemaining();
            turn++;
            botMessage.content=content();
            if(!end)createCollector();
          };
          refreshMessage();
        });
        collector.on("end",collected=>{
          if(!collected.size){
            new EndMessage({
              hostId:message.author.id,
              channel:message.channel,
              game:module.exports.gameName,
              losers:[utils.loopIdGetter(players,turn)],
              winners:players.filter(playerId=>playerId!=utils.loopIdGetter(players,turn)),
              reason:"The game ended due to inactivity",
              rules:module.exports.description,
              gameStart:startDate
            }).send();
          };
        });
      };
      function playTurn(x,y,option){
        if(option=="check"){
          if(map[y][x]==emojis[0]){
            hiddenMap[y][x]=mineCount(x,y);
            map[y][x]=emojis[1];
            if(map[y][x+1]==emojis[0]){
              if(hiddenMap[y][x]==emojis[0])playTurn(x+1,y,option);
            };
            if(map[y][x-1]==emojis[0]){
              if(hiddenMap[y][x]==emojis[0])playTurn(x-1,y,option);
            };
            if(map[y+1]&&map[y+1][x]==emojis[0]){
              if(hiddenMap[y][x]==emojis[0])playTurn(x,y+1,option);
            };
            if(map[y-1]&&map[y-1][x]==emojis[0]){
              if(hiddenMap[y][x]==emojis[0])playTurn(x,y-1,option);
            };
            if(map[y-1]&&map[y-1][x-1]==emojis[0]){
              if(hiddenMap[y][x]==emojis[0])playTurn(x-1,y-1,option);
            };
            if(map[y-1]&&map[y-1][x+1]==emojis[0]){
              if(hiddenMap[y][x]==emojis[0])playTurn(x+1,y-1,option);
            };
            if(map[y+1]&&map[y+1][x-1]==emojis[0]){
              if(hiddenMap[y][x]==emojis[0])playTurn(x-1,y+1,option);
            };
            if(map[y+1]&&map[y+1][x+1]==emojis[0]){
              if(hiddenMap[y][x]==emojis[0])playTurn(x+1,y+1,option);
            };
          }else if(map[y][x]==emojis[2]){
            for(let my=0;my<8;my++){
              for(let mx=0;mx<12;mx++){
                if(map[my][mx]==emojis[2])hiddenMap[my][mx]=emojis[2];
              };
            };
            end=true;
            new EndMessage({
              hostId:message.author.id,
              channel:message.channel,
              game:module.exports.gameName,
              losers:[utils.loopIdGetter(players,turn)],
              winners:players.filter(playerId=>playerId!=utils.loopIdGetter(players,turn)),
              reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,turn)).user.username} has set off a bomb`,
              rules:module.exports.description,
              gameStart:startDate
            }).send();
          };
        }else if(option=="spot"){
          hiddenMap[y][x]=emojis[3];
        };
        botMessage.content=content();
      };
      function mineCount(x,y){
        var count=0;
        if(map[y][x+1]==emojis[2])count++;
        if(map[y+1]&&map[y+1][x+1]==emojis[2])count++;
        if(map[y+1]&&map[y+1][x]==emojis[2])count++;
        if(map[y+1]&&map[y+1][x-1]==emojis[2])count++;
        if(map[y][x-1]==emojis[2])count++;
        if(map[y-1]&&map[y-1][x-1]==emojis[2])count++;
        if(map[y-1]&&map[y-1][x]==emojis[2])count++;
        if(map[y-1]&&map[y-1][x+1]==emojis[2])count++;
        if(!count)return emojis[0];
        return`:${numberToText.convertToText(count).toLowerCase()}:`;
      };
      function checkRemaining(){
        var hasFreeSpace=false
        var hasExplosions=false;
        var flagCount=0;
        for(let y=0;y<8;y++){
          for(let x=0;x<12;x++){
            if(hiddenMap[y][x]==emojis[1]&&map[y][x]!=emojis[2])hasFreeSpace=true;
            if(hiddenMap[y][x]==emojis[2])hasExplosions=true;
            if(hiddenMap[y][x]==emojis[3]&&map[y][x]==emojis[2])flagCount++;
          };
        };
        if(!hasFreeSpace&&!hasExplosions||flagCount==mineNumber){
          end=true;
          new EndMessage({
            hostId:message.author.id,
            channel:message.channel,
            game:module.exports.gameName,
            winners:players,
            reason:`All the mines have been found`,
            rules:module.exports.description,
            gameStart:startDate
          }).send();
        };
      };
    });
  },
  name:"minesweeper",
  aliases:["ms","mines","miner"],
  description:"The numbers on the board represent how many bombs are adjacent to a square. For example, if a square has a \"3\" on it, then there are 3 bombs next to that square. The bombs could be above, below, right left, or diagonal to the square. Avoid all the bombs and expose all the empty spaces to win Minesweeper.",
  category:"game",
  shortRules:"To play to the minesweeper",
  exemples:`\`${process.env.BOT_PREFIX}minesweeper\` <- no args required`,
  gameName:"Minesweeper",
  icon:"https://i.imgur.com/DObJLb1.png",
  cooldown:1.5e4
};