const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const EndMessage=require("../utils/EndMessage");
const ms=require("ms");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({message})=>{
    const isFloat=n=>Number(n)==n&&n%1!=0;
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
      const startDate=Date.now();
      const inGamePlayers=[...players];
      if(inGamePlayers.length<2)playGame(Math.floor(Math.random()*9998)+1,inGamePlayers[0]);
      else{
        const composer=inGamePlayers.splice(Math.floor(Math.random()*inGamePlayers.length))[0];
        message.guild.members.cache.get(composer).send({content:":speech_balloon: Text me a number to guess"});
        askWord();
        async function askWord(){
          const dmChannel=await message.guild.members.cache.get(composer).createDM();
          const filter=m=>m.author.id==composer;
          const collector=dmChannel.createMessageCollector({filter,max:1});
          collector.on("collect",async numberMessage=>{
            const correctNumber=await numberMessage.content.trim();
            if(correctNumber.length>30||correctNumber.length<3||isNaN(correctNumber)||isFloat(correctNumber)){
              await dmChannel.send({content:"The number to guess can't contains commas and must be between 1 and 9999"});
              askWord();
            }else{
              const channelInvite=await message.channel.createInvite();
              dmChannel.send({content:`Number succesfully created, you can return in the server.\n${channelInvite}`});
              return playGame(parseInt(correctNumber),inGamePlayers[0],composer);
            };
          });
        };
      };
      function playGame(correctNumber,guesser,composer){
        const time=6e4;
        var ended=false;
        botMessage.edit({
          components:[],
          embeds:[],
          content:`:1234: The number to guess is between \`1\` and \`9999\`\nType the number you think it is! You have ${ms(time,{long:true})}`
        });
        const collector=message.channel.createMessageCollector({
          time,
          filter:numberMessage=>numberMessage.author.id==guesser
        });
        collector.on("collect",async numberMessage=>{
          const number=await numberMessage.content.trim();
          if(number.length>30||number.length<3||isNaN(number)||isFloat(number)){
            numberMessage.reply({content:"The number to guess can't contains commas and must be between 1 and 9999"});
          }else{
            if(parseInt(number)<correctNumber)numberMessage.reply({content:"More"});
            if(parseInt(number)>correctNumber)numberMessage.reply({content:"Less"});
            else if(parseInt(number)==correctNumber){
              ended=true;
              new EndMessage({
                hostId:message.author.id,
                channel:message.channel,
                game:module.exports.gameName,
                rules:module.exports.description,
                losers:composer?[composer]:undefined,
                winners:[guesser],
                reason:`The correct number was ${correctNumber}`,
                gameStart:startDate
              }).send();
              return collector.stop();
            };
          };
        });
        collector.on("end",()=>{
          if(!ended)return new EndMessage({
            hostId:message.author.id,
            channel:message.channel,
            game:module.exports.gameName,
            rules:module.exports.description,
            losers:[guesser],
            winners:composer?[composer]:undefined,
            reason:`The correct number was ${correctNumber}`,
            gameStart:startDate
          }).send();
        });
      };
    });
  },
  name:"guessthenumber",
  aliases:["gtn"],
  description:"You have to guess the correct number thanks to the plus or minus, you have to find the correct number to win the game.",
  category:"game",
  shortRules:"To play to the guess number game",
  exemples:`\`${process.env.BOT_PREFIX}guessthenumber\` <- no args required`,
  gameName:"Guess the number",
  icon:"https://i.imgur.com/VAlYiSw.png",
  cooldown:1.5e4
};