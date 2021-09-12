const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
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
      maxPlayers:2,
      minPlayers:2,
      message:message,
      rules:module.exports.description
    });
    lobby.start(async(players,botMessage)=>{
      const inGamePlayers=[...players];
      const startDate=new Date();
      const letters="🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮".split(" ");
      const emojis=[letters,"❌","⭕"];
      const map=[];
      for(let x=0;x<3;x++)map.push([emojis[0][x*3],emojis[0][x*3+1],emojis[0][x*3+2]]);
      const cross={emoji:emojis[1],playerId:inGamePlayers.splice(Math.floor(Math.random()*inGamePlayers.length),1)[0]};
      const circle={emoji:emojis[2],playerId:inGamePlayers[0]};
      var curPlayer=cross;
      var played=false;
      refreshMessage=()=>botMessage.edit({
        content:`This is the ${message.guild.members.cache.get(curPlayer.playerId).user}'s turn\n${map.map(row=>row.join(" ")).join("\n")}`,
        embeds:[],
        components:[]
      });
      refreshMessage();
      createCollector();
      async function createCollector(){
        played=false;
        const filter=m=>m.author.id==cross.playerId||m.author.id==circle.playerId;
        const collector=message.channel.createMessageCollector({filter,max:1,time:3e5});
        collector.on("collect",async letterMessage=>{
          played=true;
          const letterAuthorId=letterMessage.author.id;
          const letter=letterMessage.content.toLowerCase();
          if(letterMessage.deletable)letterMessage.delete();
          if(letterAuthorId!=curPlayer.playerId){
            const replyMessage=await message.channel.send({
              content:`This is not your turn to play`
            });
            return setTimeout(()=>{
              if(replyMessage.deletable)replyMessage.delete();
              return createCollector();
            },2e3);
          };
          if(letter.length!=1||!letter.match(/[a-i]/g)){
            const replyMessage=await message.channel.send({
              content:`Your message should be only one letter between A and I`
            });
            return setTimeout(()=>{
              if(replyMessage.deletable)replyMessage.delete();
              return createCollector();
            },2e3);
          };
          const lettersPos={
            "a":[0,0],
            "b":[1,0],
            "c":[2,0],
            "d":[0,1],
            "e":[1,1],
            "f":[2,1],
            "g":[0,2],
            "h":[1,2],
            "i":[2,2],
          };
          if(!letters.includes(map[lettersPos[letter][1]][lettersPos[letter][0]])){
            const replyMessage=await message.channel.send({
              content:`You can't place your pawn here`
            });
            return setTimeout(()=>{
              if(replyMessage.deletable)replyMessage.delete();
              return createCollector();
            },2e3);
          };
          map[lettersPos[letter][1]][lettersPos[letter][0]]=curPlayer.emoji;
          if(curPlayer==cross)curPlayer=circle;
          else curPlayer=cross;
          if(!isEnd())createCollector();
          refreshMessage();
        });
        setTimeout(()=>{
          if(!played)return new EndMessage({
            hostId:message.author.id,
            channel:message.channel,
            game:module.exports.gameName,
            rules:module.exports.description,
            losers:[cross.playerId,circle.playerId],
            reason:`Ended by inactivity`,
            gameStart:startDate
          }).send();
        },3e5);
      };
      function isEnd(){
        function checkEnd(){
          var hasVoid=false;
          for(let y=0;y<3;y++){
            for(let x=0;x<3;x++){
              if(!hasVoid&&letters.includes(map[y][x]))hasVoid=true;
              try{
                if(map[y][x]==map[y][x+1]&&map[y][x]==map[y][x+2])return map[y][x];
              }catch(error){};
              try{
                if(map[y][x]==map[y+1][x+1]&&map[y][x]==map[y+2][x+2])return map[y][x];
              }catch(error){};
              try{
                if(map[y][x]==map[y+1][x]&&map[y][x]==map[y+2][x])return map[y][x];
              }catch(error){};
              try{
                if(map[y][x]==map[y-1][x+1]&&map[y][x]==map[y-2][x+2])return map[y][x];
              }catch(error){};
            };
          };
          if(!hasVoid)return letters[0];
          return undefined;
        };
        const end=checkEnd();
        if(!end)return false;
        else{
          const endMessage=new EndMessage({
            hostId:message.author.id,
            channel:message.channel,
            game:module.exports.gameName,
            rules:module.exports.description,
            gameStart:startDate
          });
          if(end==cross.emoji){
            endMessage.winners=[cross.playerId];
            endMessage.losers=[circle.playerId];
            endMessage.reason=`${message.guild.members.cache.get(cross.playerId).user.username} won the game`;
          }else if(end==circle.emoji){
            endMessage.losers=[cross.playerId];
            endMessage.winners=[circle.playerId];
            endMessage.reason=`${message.guild.members.cache.get(circle.playerId).user.username} won the game`;
          }else{
            endMessage.losers=[cross.playerId,circle.playerId];
            endMessage.reason=`There is an equality`;
          };
          endMessage.send();
          return true;
        };
      };
    });
  },
  name:"tictactoe",
  aliases:["ttt"],
  description:"The game is played on a grid that's 3 squares by 3 squares. You are X, your friend is O. Players take turns putting their marks in empty squares. The first player to get 3 of her marks in a row (up, down, across, or diagonally) is the winner. When all 9 squares are full, the game is over.",
  category:"game",
  shortRules:"To play to the tic tac toe",
  exemples:`\`${process.env.BOT_PREFIX}tictactoe\` <- no args required`,
  gameName:"Tic tac toe",
  icon:"https://i.imgur.com/lwvTuhr.png",
  cooldown:1.5e4
};