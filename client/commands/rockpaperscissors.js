const Discord=require("discord.js");
const EndMessage=require("../utils/EndMessage");
const Lobby=require("../utils/Lobby");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({message})=>{
    const startDate=new Date();
    const rounds=[];
    const maxRounds=5;
    const askMessages=[];
    const IDtoUsername=id=>message.guild.members.cache.get(id).user.username;
    const IDtoUserJSON=id=>message.guild.members.cache.get(id).user;
    const lobby=new Lobby({
      message:message,
      game:module.exports.gameName,
      icon:module.exports.icon,
      rules:module.exports.description,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:2
    });
    lobby.start(async players=>{
      playGame();
      function playGame(){
        const playerChoices=players.map(playerId=>{
          return{choice:null,playerId,askMessage:undefined};
        });
        players.forEach(async(playerId,index)=>{
          function choiceContent(){
            return{
              content:`Choose something between rock, paper and scissors.\n${playerChoices.map(player=>{
                if(!player.choice)return`${IDtoUsername(player.playerId)}: <a:Loading:867315391939477514>`;
                else return`${IDtoUsername(player.playerId)}: <:On:870024897315880991>`;
              }).join(" | ")}`,
              components:[
                new Discord.MessageActionRow()
                .addComponents(
                  new Discord.MessageButton().setCustomId("rock").setEmoji("✊").setStyle("PRIMARY").setLabel("Rock"),
                  new Discord.MessageButton().setCustomId("paper").setEmoji("✋").setStyle("PRIMARY").setLabel("Paper"),
                  new Discord.MessageButton().setCustomId("scissors").setEmoji("✌️").setStyle("PRIMARY").setLabel("Scissors")
                )
              ]
            };
          };
          if(!askMessages[index])askMessages[index]=await IDtoUserJSON(playerId).send(choiceContent());
          else askMessages[index].edit(choiceContent());
          const filter=component=>component.componentType=="BUTTON";
          const collector=askMessages[index].createMessageComponentCollector({filter,time:3e4,max:1});
          var played=false;
          collector.on("collect",async button=>{
            button.deferUpdate();
            played=true;
            playerChoices[index].choice=button.customId;
            playerChoices[index].askMessage=askMessages[index];
            askMessages.forEach(am=>am.edit(choiceContent()));
            if(playerChoices[index==1?0:1].choice)doResult(playerChoices);
          });
          setTimeout(()=>{
            if(played)return;
          },3e4);
        });
        function doResult(playerChoices){
          function getWinner(){
            if(playerChoices[0].choice==playerChoices[1].choice)return playerChoices;
            if(playerChoices[0].choice=="rock"&&playerChoices[1].choice=="paper")return playerChoices[1];
            if(playerChoices[0].choice=="paper"&&playerChoices[1].choice=="scissors")return playerChoices[1];
            if(playerChoices[0].choice=="scissors"&&playerChoices[1].choice=="rock")return playerChoices[1];
            if(playerChoices[1].choice=="rock"&&playerChoices[0].choice=="paper")return playerChoices[0];
            if(playerChoices[1].choice=="paper"&&playerChoices[0].choice=="scissors")return playerChoices[0];
            if(playerChoices[1].choice=="scissors"&&playerChoices[0].choice=="rock")return playerChoices[0];
            return undefined;
          };
          const winner=getWinner();
          if(winner.length){
            winner.forEach(user=>{
              user.askMessage.edit({
                content:`<:None:870024851803492433> Equality\n${playerChoices.map(player=>{
                  if(player.choice=="rock")return`${IDtoUsername(player.playerId)}: ✊`;
                  if(player.choice=="paper")return`${IDtoUsername(player.playerId)}: ✋`;
                  if(player.choice=="scissors")return`${IDtoUsername(player.playerId)}: ✌️`;
                }).join(" | ")}`,
                components:[]
              });
              rounds.push({winner:null,loser:null});
            });
          }else{
            const loser=playerChoices.filter(playerChoice=>playerChoice.playerId!=winner.playerId)[0];
            winner.askMessage.edit({
              content:`<:On:870024897315880991> You won this round\n${playerChoices.map(player=>{
                if(player.choice=="rock")return`${IDtoUsername(player.playerId)}: ✊`;
                if(player.choice=="paper")return`${IDtoUsername(player.playerId)}: ✋`;
                if(player.choice=="scissors")return`${IDtoUsername(player.playerId)}: ✌️`;
              }).join(" | ")}`,
              components:[]
            });
            loser.askMessage.edit({
                content:`<:off:869978532489617458> You lost this round\n${playerChoices.map(player=>{
                  if(player.choice=="rock")return`${IDtoUsername(player.playerId)}: ✊`;
                  if(player.choice=="paper")return`${IDtoUsername(player.playerId)}: ✋`;
                  if(player.choice=="scissors")return`${IDtoUsername(player.playerId)}: ✌️`;
                }).join(" | ")}`,
                components:[]
            });
            rounds.push({winner:winner.playerId,loser:loser.playerId});
          };
          setTimeout(()=>{
            if(rounds.length>=maxRounds){
              const winnerArray=rounds.map(round=>round.winner);
              const arrToInstanceCountObj=arr=>arr.reduce((obj,e)=>{
                obj[e]=(obj[e]||0)+1;
                return obj;
              },{});
              const entries=Object.entries(arrToInstanceCountObj(winnerArray.filter(userId=>userId)));
              function determineWinner(){
                if(!entries.length)return null;
                if(entries.length==1)return entries[0][0];
                if(entries[0][1]>entries[1][1])return entries[0][0];
                if(entries[0][1]<entries[1][1])return entries[1][0];
                if(entries[0][1]==entries[1][1])return null;
              };
              const finalWinner=playerChoices.find(user=>user.playerId==determineWinner());
              if(!finalWinner){
                playerChoices.forEach(async({askMessage})=>{
                  const invite=await message.channel.createInvite();
                  askMessage.edit({
                    content:`You can return in ${message.guild.name}\n${invite}`
                  });
                });
                new EndMessage({
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  losers:playerChoices.map(pc=>pc.playerId),
                  reason:`There is an equality!`,
                  rules:module.exports.description,
                  gameStart:startDate
                }).send();
              }else{
                const finalLose=playerChoices.find(user=>user.playerId!=finalWinner.playerId);
                playerChoices.forEach(async({askMessage})=>{
                  const invite=await message.channel.createInvite();
                  askMessage.edit({
                    content:`You can return in ${message.guild.name}\n${invite}`
                  });
                });
                new EndMessage({
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  losers:[finalLose.playerId],
                  winners:[finalWinner.playerId],
                  reason:`${message.guild.members.cache.get(finalWinner.playerId).user.username} won the game!`,
                  rules:module.exports.description,
                  gameStart:startDate
                }).send();
              };
            }else playGame();
          },3e3);
        };
      };
    });
  },
  name:"rockpaperscissors",
  aliases:["rps","rock","paper","scissors","chifoumi","cfm"],
  description:"The game is played where players deliver hand signals that will represent the elements of the game; rock, paper and scissors. The outcome of the game is determined by 3 simple rules: Rock wins against scissors. Scissors win against paper. Paper wins against rock.",
  category:"game",
  shortRules:"To play to the rock paper scissors",
  exemples:`\`${process.env.BOT_PREFIX}rockpaperscissors\` <- no args required`,
  gameName:"Rock paper scissors",
  icon:"https://i.imgur.com/PKFRlpe.png",
  cooldown:1.5e4
};