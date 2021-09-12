const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const numberToText=require("number-to-text");
const emojiConvert=require("discord-emoji-converter");
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
    const lobby=new Lobby({
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:1,
      message:message,
      rules:module.exports.description
    });
    lobby.start(async(players,botMessage)=>{
      const gameStart=Date.now();
      var turn=0;
      if(players.length<2)players.push(client.user.id);
      players=utils.shuffle(players);
      const emojis=["⚪","🟡","🔴"];
      const map=[];
      for(let y=0;y<6;y++){
        const row=[];
        for(let x=0;x<7;x++)row.push(emojis[0]);
        map.push(row);
      };
      function addNumbers(map){
        const numbers=[];
        for(let i=0;i<map[0].length;i++)numbers.push(`:${numberToText.convertToText(i+1).toLowerCase()}:`);
        return[...map,numbers];
      };
      const refreshMessage=()=>botMessage.edit({
        content:botMessage.content,
        embeds:botMessage.embeds,
        components:botMessage.components
      });
      botMessage.components=[];
      botMessage.embeds=[];
      botMessage.content=`${message.guild.members.cache.get(players[0]).user}'s turn\n\n${addNumbers(map).map(row=>row.join(" ")).join("\n")}`;
      refreshMessage();
      const reactions=[];
      for(let i=0;i<map[0].length;i++)reactions.push(emojiConvert.emojify(`:${numberToText.convertToText(i+1).toLowerCase()}:`));
      reactions.forEach(reaction=>botMessage.react(reaction));
      createCollector();
      function createCollector(){
        const curPlayer=utils.loopIdGetter(players,turn);
        if(curPlayer==client.user.id){
          const botColor=emojis[players.indexOf(curPlayer)+1];
          const userColor=emojis.find(emoji=>emoji!=emojis[0]&&emoji!=botColor);
          setTimeout(()=>{
            function botPlacement(){
              for(let y=0;y<map.length;y++)for(let x=0;x<map[0].length;x++){
                const isEmpty=(x,y)=>map[y][x]==emojis[0];
                try{
                  if(map[y][x]==userColor&&map[y][x+1]==userColor&&isEmpty(x+2,y))return x+2;
                }catch(error){};
                try{
                  if(map[y][x]==userColor&&map[y][x+1]==userColor&&isEmpty(x-1,y))return x-1;
                }catch(error){};
                try{
                  if(map[y][x]==userColor&&map[y+1][x]==userColor&&isEmpty(x,y-1))return x;
                }catch(error){};
                try{
                  if(map[y][x]==userColor&&map[y+1][x+1]==userColor&&!isEmpty(x+2,y+1)&&isEmpty(x+2,y+2))return x+2;
                }catch(error){};
                try{
                  if(map[y][x]==userColor&&map[y+1][x-1]==userColor&&!isEmpty(x-2,y+1)&&isEmpty(x-2,y+2))return x-2;
                }catch(error){};
                try{
                  if(map[y][x]==userColor&&map[y+1][x]==userColor&&map[y+2][x]==userColor&&isEmpty(x,y-1))return x;
                }catch(error){};
                try{
                  if(map[y][x]==userColor&&map[y+1][x+1]==userColor&&!isEmpty(x-1,y+1)&&isEmpty(x-1,y+2))return x-1;
                }catch(error){};
              };
              return Math.floor(Math.random()*map[0].length);
            };
            const placement=botPlacement();
            const pawnYPlacement=getColPawnNumber(placement);
            map[map.length-1-pawnYPlacement][placement]=botColor;
            botMessage.content=`${message.guild.members.cache.get(utils.loopIdGetter(players,turn+1)).user}'s turn\n\n${addNumbers(map).map(row=>row.join(" ")).join("\n")}`;
            turn++;
            refreshMessage();
            const end=isEnd();
            if(end){
              if(end==emojis[0])return new EndMessage({
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                losers:[players],
                reason:"There is an equality",
                rules:module.exports.description
              }).send();
              else if(end==emojis[players.indexOf(curPlayer)+1])return new EndMessage({
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                winners:[utils.loopIdGetter(players,turn+1)],
                losers:[utils.loopIdGetter(players,turn)],
                reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,turn+1)).user.username} won the game`,
                rules:module.exports.description
              }).send();
              else if(end!=emojis[players.indexOf(utils.loopIdGetter(players,turn+1))+1])return new EndMessage({
                channel:message.channel,
                game:module.exports.gameName,
                gameStart:gameStart,
                hostId:message.author.id,
                winners:[utils.loopIdGetter(players,turn)],
                losers:[utils.loopIdGetter(players,turn+1)],
                reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,turn)).user.username} won the game`,
                rules:module.exports.description
              }).send();
            }else createCollector();
          },2e3);
        }else{
          const collector=botMessage.createReactionCollector({
            filter:(reaction,user)=>reactions.includes(reaction.emoji.name)&&user.id==curPlayer,
            max:1
          });
          collector.on("collect",async(reaction,user)=>{
            reaction.users.remove(user.id);
            const placementIndex=reactions.indexOf(reaction.emoji.name);
            const pawnYPlacement=getColPawnNumber(placementIndex);
            if(pawnYPlacement>map.length-1){
              const advMessage=await message.channel.send({content:"You can't place a pawn here."});
              createCollector();
              return setTimeout(()=>advMessage.deletable?advMessage.delete():undefined,3e3);
            }else{
              map[map.length-1-pawnYPlacement][placementIndex]=emojis[players.indexOf(curPlayer)+1];
              botMessage.content=`${message.guild.members.cache.get(utils.loopIdGetter(players,turn+1)).user}'s turn\n\n${addNumbers(map).map(row=>row.join(" ")).join("\n")}`;
              turn++;
              refreshMessage();
              const end=isEnd();
              if(end){
                if(end==emojis[0])return new EndMessage({
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:gameStart,
                  hostId:message.author.id,
                  losers:[players],
                  reason:"There is an equality",
                  rules:module.exports.description
                }).send();
                else if(end==emojis[players.indexOf(curPlayer)+1])return new EndMessage({
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:gameStart,
                  hostId:message.author.id,
                  winners:[utils.loopIdGetter(players,turn+1)],
                  losers:[utils.loopIdGetter(players,turn)],
                  reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,turn+1)).user.username} won the game`,
                  rules:module.exports.description
                }).send();
                else if(end!=emojis[players.indexOf(utils.loopIdGetter(players,turn+1))+1])return new EndMessage({
                  channel:message.channel,
                  game:module.exports.gameName,
                  gameStart:gameStart,
                  hostId:message.author.id,
                  winners:[utils.loopIdGetter(players,turn)],
                  losers:[utils.loopIdGetter(players,turn+1)],
                  reason:`${message.guild.members.cache.get(utils.loopIdGetter(players,turn)).user.username} won the game`,
                  rules:module.exports.description
                }).send();
              }else createCollector();
            };
          });
        };
      };
      function isEnd(){
        function checkNullMatch(){
          var hasEmpty=false;
          for(let y=0;y<map.length;y++)for(let x=0;x<map[0].length;x++)if(map[y][x]==emojis[0])hasEmpty=true;
          return!hasEmpty;
        };
        const nullMatch=checkNullMatch();
        if(nullMatch)return emojis[0];
        for(let y=0;y<map.length;y++)for(let x=0;x<map[0].length;x++){
          try{
            if(map[y][x]!=emojis[0]&&map[y][x]==map[y][x+1]&&map[y][x]==map[y][x+2]&&map[y][x]==map[y][x+3])return map[y][x];
          }catch(error){};
          try{
            if(map[y][x]!=emojis[0]&&map[y][x]==map[y+1][x]&&map[y][x]==map[y+2][x]&&map[y][x]==map[y+3][x])return map[y][x];
          }catch(error){};
          try{
            if(map[y][x]!=emojis[0]&&map[y][x]==map[y+1][x+1]&&map[y][x]==map[y+2][x+2]&&map[y][x]==map[y+3][x+3])return map[y][x];
          }catch(error){};
          try{
            if(map[y][x]!=emojis[0]&&map[y][x]==map[y-1][x+1]&&map[y][x]==map[y-2][x+2]&&map[y][x]==map[y-3][x+3])return map[y][x];
          }catch(error){};
        };
        return undefined;
      };
      function getColPawnNumber(col){
        var pawnCount=0;
        for(let i=0;i<map.length;i++)if(map[i][col]!=emojis[0])pawnCount++;
        return pawnCount;
      };
    });
  },
  name:"connect4",
  aliases:["c4","fourinarow","fiar"],
  description:"First, decide who goes first and what color each player will have. Players must alternate turns, and only one disc can be dropped in each turn. On your turn, drop one of your colored discs from the top into any of the seven slots. The game ends when there is a 4-in-a-row or a stalemate. The starter of the previous game goes second on the next game.",
  category:"game",
  shortRules:"To play to a connect 4",
  exemples:`\`${process.env.BOT_PREFIX}connect4\` <- no args required`,
  gameName:"Connect 4",
  icon:"https://i.imgur.com/eBaWei8.png",
  cooldown:1.5e4
};