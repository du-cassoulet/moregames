const Discord=require("discord.js");
const dictionnary=require("dictionaries-in-array")("en");
const utils=require("../utils/utils");
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
      message:message,
      game:module.exports.gameName,
      icon:module.exports.icon,
      rules:module.exports.description,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:1
    });
    lobby.start(async(players,botMessage)=>{
      const startDate=new Date();
      var trys=3;
      var msg="";
      const IDtoUserJSON=id=>message.guild.members.cache.get(id).user;
      if(players.length>1){
        const inGamePlayers=[...players];
        const guesser=inGamePlayers.splice(Math.floor(Math.random()*inGamePlayers.length),1)[0];
        const host=inGamePlayers[0];
        IDtoUserJSON(host).send({content:":speech_balloon: Text me a word to guess"});
        askWord();
        async function askWord(){
          const dmChannel=await message.guild.members.cache.get(host).createDM();
          const filter=m=>m.author.id==host;
          const collector=dmChannel.createMessageCollector({filter,max:1});
          collector.on("collect",async wordMessage=>{
            if(wordMessage.author.id!=host)return;
            const textToGuess=await wordMessage.content.trim();
            var hasOtherThanLetters=false;
            for(const letter of textToGuess){
              if(!letter.match(/[a-zA-Z]/g))hasOtherThanLetters=true;
            };
            if(textToGuess.length>16||textToGuess.length<3||hasOtherThanLetters){
              await dmChannel.send({content:"The word to guess can contains only letters and can't be longer than 16 characters or lower than 3 characters.\n:speech_balloon: Send a new word."});
              askWord();
            }else{
              const channelInvite=await message.channel.createInvite();
              dmChannel.send({content:`Word succesfully created, you can return in the server.\n${channelInvite}`});
              playGame(textToGuess.split(""),guesser);
            };
          });
        };
      }else{
        const randomWord=dictionnary[Math.floor(Math.random()*dictionnary.length)].split("").filter(l=>l.match(/[a-z]/g));
        playGame(randomWord,players[0]);
      };
      function playGame(entireWord,guesser){
        const word=[...entireWord];
        var hiddenWord=[];
        word.forEach(()=>hiddenWord.push("__"));
        const scrambled=utils.shuffle(entireWord);
        const refreshMessage=()=>botMessage.edit({
          content:`\`\`\`Letters: ${scrambled.join(" ")}\n${hiddenWord.join(" ")}\n${msg}\`\`\``,
          embeds:[],
          components:[]
        });
        refreshMessage();
        const letters="azertyuiopqsdfghjklmwxcvbn";
        const letterEmojis="🇦 🇿 🇪 🇷 🇹 🇾 🇺 🇮 🇴 🇵 🇶 🇸 🇩 🇫 🇬 🇭 🇯 🇰 🇱 🇲 🇼 🇽 🇨 🇻 🇧 🇳".split(" ");
        scrambled.forEach(letter=>{
          botMessage.react(letterEmojis[letters.indexOf(letter)]);
        });
        var stack={};
        word.forEach(letter=>{
          stack[letter]?stack[letter]++:stack[letter]=1;
        });
        const filter=(_,user)=>user.id==guesser;
        const collector=botMessage.createReactionCollector({filter,time:3e5});
        collector.on("collect",(reaction,user)=>{
          const letter=letters[letterEmojis.indexOf(reaction.emoji.name)];
          stack[letter]--;
          if(!stack[letter]){
            reaction.remove();
          }else{
            reaction.users.remove(user.id);
          };
          const hiddenLength=()=>hiddenWord.filter(l=>!l.match(/[a-z]/g)).length;
          hiddenWord[word.length-hiddenLength()]=letter;
          if(!hiddenLength()){
            if(hiddenWord.join("")==word.join("")){
              collector.stop();
              const endMessage=new EndMessage({
                hostId:message.author.id,
                channel:message.channel,
                game:module.exports.gameName,
                rules:module.exports.description,
                winners:[guesser],
                reason:"The guesser won the game",
                gameStart:startDate
              });
              if(players.length>1)endMessage.losers=players.filter(playerId=>playerId!=guesser);
              endMessage.send();
            }else{
              if(trys){
                hiddenWord=word.map(()=>"__");
                msg="wrong word";
                trys--;
                scrambled.forEach(letter=>{
                  botMessage.react(letterEmojis[letters.indexOf(letter)]);
                });
                word.forEach(letter=>{
                  stack[letter]?stack[letter]++:stack[letter]=1;
                });
              }else{
                collector.stop();
                const endMessage=new EndMessage({
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  rules:module.exports.description,
                  losers:[guesser],
                  reason:"The guesser lost the game",
                  gameStart:startDate
                });
                if(players.length>1)endMessage.winners=players.filter(playerId=>playerId!=guesser);
                endMessage.send();
              };
            };
          };
          refreshMessage();
          msg="";
        });
      };
    });
  },
  name:"scramble",
  aliases:["unscramble","unscrambler","uscr","us"],
  description:"Unscramble the letters of a random word chosen by another player, if you find the correct word, you win the game, but if you don't the player who chosen the word win the game.",
  category:"game",
  shortRules:"To play to a scramble game",
  exemples:`\`${process.env.BOT_PREFIX}scramble\` <- no args required`,
  gameName:"Scramble",
  icon:"https://i.imgur.com/7z2BTwD.png",
  cooldown:1.5e4
};