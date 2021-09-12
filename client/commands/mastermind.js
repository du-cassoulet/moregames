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
      message:message,
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:2,
      minPlayers:1,
      rules:module.exports.description
    });
    lobby.start(async(players,botMessage)=>{
      const startDate=new Date();
      const inGamePlayers=[...players];
      const decoder=inGamePlayers.splice(Math.floor(Math.random()*inGamePlayers.length),1)[0];
      const codemaker=inGamePlayers.filter(p=>p!=decoder)[0];
      var end=false;
      var turns=9;
      const emojis=["🔴","🟠","🟡","🟢","🔵","🟣","🟤","⚫","⚪"];
      const[wrongPlacement,goodPlacement]=["❕","❗"];
      const code=[];
      if(!codemaker){
        for(let i=0;i<4;i++){
          code.push(emojis[Math.floor(Math.random()*emojis.length)]);
        };
        playGame(code);
      }else{
        message.guild.members.cache.get(codemaker).send({
          content:"Please compose the code"
        });
        const dmChannel=await message.guild.members.cache.get(codemaker).user.createDM();
        messageCollect();
        function messageCollect(){
          const filter=codeMessage=>codeMessage.author.id==codemaker;
          const collector=dmChannel.createMessageCollector({time:6e4,max:1,filter});
          var prompted=false;
          collector.on("collect",async codeMessage=>{
            var emojiCount=0;
            prompted=true;
            for(const emoji of codeMessage.content.trim().split(/ +/g)){
              emojiCount++;
              if(emojiCount>4||!emojis.includes(emoji)){
                messageCollect();
                const exCode=[];
                for(let i=0;i<4;i++){
                  exCode.push(emojis[Math.floor(Math.random()*emojis.length)]);
                };
                return codeMessage.reply({
                  content:`You have to input color emojis like \`${exCode.join(" ")}\` and the code should have 4 colors`
                });
              };
            };
            playGame(codeMessage.content.trim().split(/ +/g));
            dmChannel.send({
              content:`Code \`${codeMessage.content.trim()}\` created successfully`
            });
          });
          collector.on("end",()=>{
            if(prompted)return;
            dmChannel.send({
              content:`Time out! I made a code for you.`
            });
            for(let i=0;i<4;i++){
              code.push(emojis[Math.floor(Math.random()*emojis.length)]);
            };
            playGame(code);
          });
        };
      };
      function playGame(code){
        var composedCode=[];
        const pastCodes=[];
        const content=()=>`Write your codes:\n\n${pastCodes.map(c=>`${c.code.map(c2=>`\\${c2}`).join(" ")} ${c.results.gPlacement.join("")}${c.results.wPlacement.join("")}`).join("\n")}\n-----------------\n${composedCode.map(c2=>`\\${c2}`).join(" ")}`;
        botMessage.edit({
          content:content(),
          components:[],
          embeds:[]
        });
        emojis.forEach(emoji=>botMessage.react(emoji));
        const collector=botMessage.createReactionCollector({time:3e5});
        collector.on("end",()=>{
          if(end)return;
          return message.channel.send({content:"time elapsed"});
        });
        collector.on("collect",async(reaction,user)=>{
          if(user.id!=decoder)return;
          reaction.users.remove(user.id);
          composedCode.push(reaction.emoji.name);
          if(composedCode.length>=4){
            const results={gPlacement:[],wPlacement:[]};
            const usedColors=[];
            composedCode.forEach(color=>{
              if(usedColors.includes(color))return;
              usedColors.push(color);
              const recurNum=code.filter(c=>c==color).length;
              var recurNumComp=composedCode.filter(c=>c==color).length;
              if(recurNumComp>recurNum)recurNumComp=recurNum;
              const turnNum=recurNumComp-recurNum+recurNum;
              for(let i=0;i<turnNum;i++){
                results.wPlacement.push(wrongPlacement);
              };
            });
            composedCode.forEach((color,index)=>{
              if(code[index]==color){
                results.gPlacement.push(goodPlacement);
                results.wPlacement.length--;
              };
            });
            pastCodes.push({code:composedCode,results});
            composedCode=[];
            botMessage.edit({
              content:content()
            });
            if(turns==0)return endMessage(false,collector);
            if(results.gPlacement.length>=4)return endMessage(true,collector);
            turns--;
          }else{
            botMessage.edit({
              content:content()
            });
          };
        });
        function endMessage(isWin,collector){
          end=true;
          collector.stop();
          if(isWin){
            const endMessage=new EndMessage({
              hostId:message.author.id,
              channel:message.channel,
              game:module.exports.gameName,
              winners:[decoder],
              reason:`${message.guild.members.cache.get(decoder).user.username} won the game!`,
              rules:module.exports.description,
              gameStart:startDate
            });
            if(codemaker)endMessage.losers=[codemaker];
            endMessage.send();
            return;
          }else{
            const endMessage=new EndMessage({
              hostId:message.author.id,
              channel:message.channel,
              game:module.exports.gameName,
              losers:[decoder],
              rules:module.exports.description,
              gameStart:startDate
            });
            if(codemaker){
              endMessage.winners=[codemaker];
              endMessage.reason=`${message.guild.members.cache.get(codemaker).user.username} won the game!`;
            }else endMessage.reason=`${message.guild.members.cache.get(decoder).user.username} lost the game!`;
            endMessage.send();
            return;
          };
        };
      };
    });
  },
  name:"mastermind",
  aliases:["codemaster","codebreaker","colorcodes","cc"],
  description:"That player must lift the Secrecy screen at the end of the unit and insert four Code pegs (their secret code) into the holes underneath. Once the code is set, the Decoder can begin guessing, trying to duplicate the exact colors and positions of the hidden Code pegs. Each guess is made by placing a row of Code pegs on the unit.",
  category:"game",
  shortRules:"To play to the mastermind",
  exemples:`\`${process.env.BOT_PREFIX}mastermind\` <- no args required`,
  gameName:"Mastermind",
  icon:"https://i.imgur.com/wm7gkLT.png",
  cooldown:1.5e4
};