const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const utils=require("../utils/utils");
const numberToText=require("number-to-text");
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
      rules:module.exports.description
    });
    lobby.start(async(players,botMessage)=>{
      const gameStart=Date.now();
      var turn=0;
      const abc="abcdefghijklmnopqrstuvwxyz";
      const map=[];
      const hiddenMap=[];
      const emojis=["⬛","🟥","<:N_:718506491660992735>","⬜"];
      for(let i=0;i<5;i++){
        const row=[];
        for(let j=0;j<5;j++)row.push(emojis[0]);
        map.push([...row]);
        hiddenMap.push([...row]);
      };
      const boxNumber=15;
      var curBoxes=boxNumber;
      var findedNumber=0;
      setBoxes();
      function setBoxes(){
        if(!curBoxes)return;
        const x=Math.floor(Math.random()*map[0].length);
        const y=Math.floor(Math.random()*map.length);
        if(map[y][x]==emojis[0]){
          map[y][x]=emojis[1];
          curBoxes--;
        };
        setBoxes();
      };
      function setFrame(mapSk){
        var frameMap=[];
        mapSk.forEach(row=>frameMap.push([...row]));
        for(let y=0;y<map.length;y++){
          const alignEmojis=getRowNum([0,y],[map[0].length-1,y]);
          const voidNumber=3-alignEmojis.length;
          const voidArray=[];
          for(let vn=0;vn<voidNumber;vn++)voidArray.push(emojis[2]);
          frameMap[y]=[...voidArray,...alignEmojis,"<a:right:885131088178065439>",...frameMap[y]];
        };
        const allRows=[];
        for(let x=0;x<map[0].length;x++){
          const alignEmojis=getRowNum([x,0],[x,map.length-1]);
          allRows.push(alignEmojis.reverse());
        };
        function voidArray(num,emoji=emojis[2]){
          const arr=[];
          for(let i=0;i<num;i++)arr.push(emoji);
          return arr;
        };
        const rows=[voidArray(4),voidArray(4),voidArray(4)];
        allRows.forEach(row=>{
          for(let i=0;i<rows.length;i++){
            const invertedIndex=2-i;
            rows[invertedIndex].push(row[i]||emojis[2]);
          };
        });
        frameMap=[...rows,[...voidArray(4),...voidArray(5,"<a:down:885131088723337236>")],...frameMap];
        function getRowNum(pos1,pos2){
          const[p1x,p1y]=pos1;
          const[p2x,p2y]=pos2;
          const xDiff=p2x-p1x;
          const yDiff=p2y-p1y;
          const row=[];
          for(let x=0;x<xDiff+1;x++)for(let y=0;y<yDiff+1;y++){
            if(!xDiff)row.push(map[y][pos1[0]]);
            else if(!yDiff)row.push(map[pos1[1]][x]);
          };
          const aligns=[];
          var curAlign=0;
          row.forEach((block,index)=>{
            if(block==emojis[1]||block==emojis[3]){
              if(index+1==row.length){
                curAlign++;
                aligns.push(curAlign);
              }else curAlign++;
            }else if(curAlign!=0){
              aligns.push(curAlign);
              curAlign=0;
            };
          });
          const emojiAligns=aligns.map(number=>`:${numberToText.convertToText(number).toLowerCase()}:`);
          return emojiAligns;
        };
        const numberRow=voidArray(4);
        for(let y=0;y<map.length;y++){
          numberRow.push(`:regional_indicator_${abc[y]}:`);
        };
        for(let x=0;x<map[0].length;x++){
          frameMap[x+4].push(`:${numberToText.convertToText(x+1).toLowerCase()}:`)
        };
        frameMap.push(numberRow);
        return frameMap;
      };
      const rows=[new Discord.MessageActionRow(),new Discord.MessageActionRow()];
      var buttons=[];
      for(let i=0;i<5;i++){
        buttons.push(
          new Discord.MessageButton()
          .setCustomId(`y:${i}`)
          .setLabel((i+1).toString())
          .setStyle("SUCCESS")
        );
      };
      rows[0].addComponents(...buttons);
      buttons=[];
      for(let i=0;i<5;i++){
        buttons.push(
          new Discord.MessageButton()
          .setCustomId(`x:${i}`)
          .setLabel(abc[i].toUpperCase())
          .setStyle("DANGER")
        );
      };
      rows[1].addComponents(...buttons);
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        embeds:botMessage.embeds
      });
      botMessage.content=`${players.length>1?`${message.guild.members.cache.get(utils.loopIdGetter(players,turn)).user}'s turn\n`:""}${setFrame(hiddenMap).map(row=>row.join("")).join("\n")}`;
      botMessage.embeds=[];
      botMessage.components=[...rows];
      refreshMessage();
      createCollector();
      function createCollector(){
        var x,y;
        const collector=botMessage.createMessageComponentCollector({
          time:1.5e5,
          filter:button=>players.includes(button.user.id)
        });
        collector.on("collect",async button=>{
          button.deferUpdate();
          if(utils.loopIdGetter(players,turn)!=button.user.id)return;
          if(button.customId.startsWith("x:")){
            if(x!=undefined)botMessage.components[1].components[x].setStyle("DANGER");
            x=parseInt(button.customId.split(":")[1]);
            botMessage.components[1].components[x].setStyle("SECONDARY");
            if(x!=undefined&&y!=undefined)playTurn();
            else refreshMessage();
          }else if(button.customId.startsWith("y:")){
            if(y!=undefined)botMessage.components[0].components[y].setStyle("SUCCESS");
            y=parseInt(button.customId.split(":")[1]);
            botMessage.components[0].components[y].setStyle("SECONDARY");
            if(x!=undefined&&y!=undefined)playTurn();
            else refreshMessage();
          };
        });
        function playTurn(){
          turn++;
          collector.stop();
          if(map[y][x]==emojis[1]){
            hiddenMap[y][x]=map[y][x];
            map[y][x]=emojis[3];
            botMessage.content=`${players.length>1?`${message.guild.members.cache.get(utils.loopIdGetter(players,turn)).user}'s turn\n`:""}${setFrame(hiddenMap).map(row=>row.join("")).join("\n")}`;
            findedNumber++;
            if(findedNumber>=boxNumber){
              new EndMessage({
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                winners:players,
                reason:"You found all the boxes",
                rules:module.exports.description
              }).send();
            }else createCollector();
          }else if(map[y][x]==emojis[3])createCollector();
          else new EndMessage({
            channel:message.channel,
            game:module.exports.gameName,
            gameStart:gameStart,
            hostId:message.author.id,
            losers:players,
            reason:"You lose the game",
            rules:module.exports.description
          }).send();
          botMessage.components[1].components[x].setStyle("DANGER");
          botMessage.components[0].components[y].setStyle("SUCCESS");
          refreshMessage();
        };
      };
    });
  },
  name:"nonogram",
  aliases:["nng","hanjie","picross","griddlers","paintbynumbers","edel"],
  description:"Nonograms are picture logic puzzles in which cells in a grid must be colored or left blank according to numbers at the side of the grid to reveal a hidden picture. For example, a clue of \"4 8 3\" would mean there are sets of four, eight, and three filled squares, in that order, with at least one blank square between successive groups.",
  category:"game",
  shortRules:"To play to a nonogram",
  exemples:`\`${process.env.BOT_PREFIX}nonogram\` <- no args required`,
  gameName:"Nonograme",
  icon:"https://i.imgur.com/eFNBUXw.png",
  cooldown:1.5e4
};