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
  func:({message})=>{
    const lobby=new Lobby({
      message:message,
      game:module.exports.gameName,
      icon:module.exports.icon,
      rules:module.exports.description,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:2
    });
    lobby.start(async(players,botMessage)=>{
      const startDate=new Date();
      const allPlayers=[...players];
      const inGamePlayers=[...players];
      var curHangStep=0;
      const hangSteps=[
        `​      __            __\n      |          |\n      |\n      |\n__      |        __`,
        ` ​       __            __\n        |          |\n        |         O\n        |\n  __      |        __`,
        `​        __            __\n        |          |\n        |         O\n        |          |\n  __      |        __`,
        `​        __            __\n        |          |\n        |         O\n        |        /|\n  __      |        __`,
        `​        __            __\n        |          |\n        |         O\n        |        /|\\\n  __      |        __`,
        `​        __            __\n        |          |\n        |         O\n        |        /|\\\n  __      |       __ /`,
        `​        __            __\n        |          |\n        |         O\n        |        /|\\\n  __      |       __ / \\`
      ];
      const IDtoUserJSON=id=>message.guild.members.cache.get(id).user;
      const refreshMessage=async()=>botMessage.edit({
        content:botMessage.content,
        components:botMessage.components,
        embeds:botMessage.embeds
      });
      playGame();
      function playGame(){
        const guesser=inGamePlayers.splice(Math.floor(Math.random()*allPlayers.length),1)[0];
        const host=inGamePlayers[0];
        IDtoUserJSON(host).send({content:":speech_balloon: Text me a word to guess"});
        askWord();
        async function askWord(){
          const dmChannel=await message.guild.members.cache.get(host).createDM();
          const filter=m=>m.author.id==host;
          const collector=dmChannel.createMessageCollector({filter,max:1});
          collector.on("collect",async wordMessage=>{
            const textToGuess=await wordMessage.content.trim();
            var hasOtherThanLetters=false;
            for(const letter of textToGuess){
              if(!letter.match(/[a-zA-Z \-_]/g))hasOtherThanLetters=true;
            };
            if(textToGuess.length>30||textToGuess.length<3||hasOtherThanLetters){
              await dmChannel.send({content:"The word to guess can contains only letters and can't be longer than 30 characters or lower than 3 characters.\n:speech_balloon: Send a new word."});
              askWord();
            }else{
              const channelInvite=await message.channel.createInvite();
              dmChannel.send({content:`Word succesfully created, you can return in the server.\n${channelInvite}`});
              return sendGame(textToGuess,guesser,host);
            };
          });
        };
      };
      function sendGame(textToGuess,guesser,host){
        textToGuess=[...textToGuess.replace(/[ _]/g,"-").toLowerCase()];
        var hiddenWord=[...textToGuess].map(letter=>{
          if(letter.match(/[a-z]/g))return"_";
          else return letter;
        });
        botMessage.embeds=[];
        botMessage.components=[];
        botMessage.content=`${hangSteps[0]}\n\`\`\` ${hiddenWord.join("  ")} \`\`\``;
        refreshMessage();
        collectLetter();
        function collectLetter(){
          const collector=message.channel.createMessageCollector({filter:message=>message.author.id==guesser,max:1});
          collector.on("collect",async letter=>{
            if(letter.content.startsWith(db.get(`${message.guild}-prefix`)))return collectLetter();
            if(letter.deletable)letter.delete().catch(()=>{});
            if(letter.content.length!=1||!letter.content.toLowerCase().match(/[a-z]/g)){
              message.channel.send("<:off:869978532489617458> You have to input one letter").then(bm=>setTimeout(()=>bm.deletable?bm.delete():undefined,3e3));
              return collectLetter();
            }else{
              letter.content=letter.content.toLowerCase();
              if(hiddenWord.includes(letter.content)){
                message.channel.send("<:off:869978532489617458> This letter is already discovered").then(bm=>setTimeout(()=>bm.deletable?bm.delete():undefined,3e3));
                return collectLetter();
              }else if(textToGuess.includes(letter.content)){
                hiddenWord=hiddenWord.map((l,index)=>{
                  if(textToGuess[index]==letter.content)return letter.content;
                  else return l;
                });
                botMessage.content=`${hangSteps[curHangStep]}\n\`\`\` ${hiddenWord.join("  ")} \`\`\``;
                await refreshMessage();
                if(hiddenWord.includes("_"))return collectLetter();
                else new EndMessage({
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  losers:[host],
                  winners:[guesser],
                  reason:`${message.guild.members.cache.get(guesser).user.username} won the game!`,
                  rules:module.exports.description,
                  gameStart:startDate
                }).send();
              }else{
                curHangStep++;
                botMessage.content=`${hangSteps[curHangStep]}\n\`\`\` ${hiddenWord.join("  ")} \`\`\``;
                await refreshMessage();
                if(curHangStep<6)return collectLetter();
                else new EndMessage({
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  losers:[guesser],
                  winners:[host],
                  reason:`${message.guild.members.cache.get(host).user.username} won the game!`,
                  rules:module.exports.description,
                  gameStart:startDate
                }).send();
              };
            };
          });
        };
      };
    });
  },
  name:"hangman",
  aliases:["hm"],
  description:"Hangman is a quick and easy game for at least two people that requires nothing more than paper, a pencil, and the ability to spell. One player, the \"host\" makes up a secret word, while the other player tries to guess the word by asking what letters it contains. However, every wrong guess brings them one step closer to losing.",
  category:"game",
  shortRules:"To play to the hangman",
  exemples:`\`${process.env.BOT_PREFIX}hangman\` <- no args required`,
  gameName:"Hangman",
  icon:"https://i.imgur.com/kI11bvU.png",
  cooldown:1.5e4
};