const Discord=require("discord.js");
const Trivia=require("trivia-api");
const utils=require("../utils/utils");
const ms=require("ms");
const HTMLEncodeDecode=require("html-encoder-decoder");
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
    const startDate=new Date();
    const lobby=new Lobby({
      game:module.exports.gameName,
      icon:module.exports.icon,
      hostId:message.author.id,
      maxPlayers:8,
      minPlayers:1,
      message:message,
      rules:module.exports.description,
      gamemodes:[
        {
          label:"Normal mode",
          description:"10 questions with a random the theme",
          emoji:"💭"
        },
        {
          label:"General knowledge - 5",
          description:"5 questions for the theme \"General knowledge\"",
          emoji:"🧠"
        },
        {
          label:"General knowledge - 10",
          description:"10 questions for the theme \"General knowledge\"",
          emoji:"💡"
        },
        {
          label:"History",
          description:"10 questions for the theme \"History\"",
          emoji:"📔"
        },
        {
          label:"Animes",
          description:"10 questions for the theme \"Animes\"",
          emoji:"🪄"
        },
        {
          label:"Hardcore",
          description:"10 hard questions with a random the theme",
          emoji:"😈"
        },
        {
          label:"Long quiz",
          description:"50 questions with a random the theme",
          emoji:"⏳"
        }
      ]
    });
    lobby.start(async(players,botMessage,gamemode)=>{
      if(gamemode=="normal_mode"){
        var turn=10;
        var difficulty=undefined;
        var category=undefined;
      }else if(gamemode=="general_knowledge___5"){
        var turn=5;
        var difficulty=undefined;
        var category=9;
      }else if(gamemode=="general_knowledge___10"){
        var turn=10;
        var difficulty=undefined;
        var category=9;
      }else if(gamemode=="history"){
        var turn=10;
        var difficulty=undefined;
        var category=23;
      }else if(gamemode=="animes"){
        var turn=10;
        var difficulty=undefined;
        var category=31;
      }else if(gamemode=="hardcore"){
        var turn=10;
        var difficulty="hard";
        var category=undefined;
      }else if(gamemode=="long_quiz"){
        var turn=50;
        var difficulty=undefined;
        var category=undefined;
      }else{
        var turn=10;
        var difficulty=undefined;
        var category=undefined;
      };
      const maxTurns=turn;
      const userResponses=[];
      players.forEach(playerId=>{
        userResponses.push({
          author:playerId,
          choice:null,
          resTime:0,
          score:0
        });
      });
      const trivia=new Trivia();
      const time=1.5e4;
      const buttons=[];
      for(let i=0;i<4;i++){
        buttons.push(
          new Discord.MessageButton().setCustomId(`answer${i}`).setStyle("SECONDARY").setLabel(`Answer ${i+1}`)
        );
      };
      const row=new Discord.MessageActionRow().addComponents(...buttons);
      trivia.getQuestions({
        amount:turn,
        type:"multiple",
        category:category,
        difficulty:difficulty
      }).then(async questions=>{
        playTurn();
        async function playTurn(){
          if(turn==0){
            if(players.length>1){
              new EndMessage({
                hostId:message.author.id,
                channel:message.channel,
                game:module.exports.gameName,
                losers:userResponses.sort((a,b)=>b.score-a.score).slice(1),
                winners:[userResponses.sort((a,b)=>b.score-a.score)[0]],
                reason:`${message.guild.members.cache.get(userResponses.sort((a,b)=>b.score-a.score)[0].author).user.username} won the game`,
                rules:module.exports.description,
                gameStart:startDate
              }).send();
            }else{
              if(userResponses[0].score>3000){
                new EndMessage({
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  winners:[players[0]],
                  reason:`${message.guild.members.cache.get(players[0]).user.username} won the game`,
                  rules:module.exports.description,
                  gameStart:startDate
                }).send();
              }else{
                new EndMessage({
                  hostId:message.author.id,
                  channel:message.channel,
                  game:module.exports.gameName,
                  losers:[players[0]],
                  reason:`${message.guild.members.cache.get(players[0]).user.username} lost the game`,
                  rules:module.exports.description,
                  gameStart:startDate
                }).send();
              };
            };
          }else{
            const endTime=Date.now()+time;
            const questionJSON=questions.results[turn-1];
            var{correct_answer,incorrect_answers,question,difficulty,category}=questionJSON;
            var answers=incorrect_answers;
            answers.push(correct_answer);
            answers=answers.map(ent=>HTMLEncodeDecode.decode(ent));
            answers=utils.shuffle(answers);
            question=HTMLEncodeDecode.decode(question);
            category=HTMLEncodeDecode.decode(category);
            const embed=new Discord.MessageEmbed();
            embed.setColor(utils.userStyle(message.author.id).main_color);
            answers.forEach((answer,index)=>{
              embed.addField(`Answer ${index+1}`,answer,true);
            });
            embed.addField("Responces",userResponses.sort((a,b)=>b.score-a.score).map(res=>`${message.guild.members.cache.get(res.author).user} ${res.choice?"<:None:870024851803492433>":"<a:Loading:867315391939477514>"}`).join("\n"),false);
            embed.setAuthor(question,message.guild.iconURL({dynamic:true}));
            embed.setFooter(`Difficulty: ${difficulty} - Category: ${category} - Turn ${maxTurns-turn+1}/${maxTurns}`);
            embed.setDescription(`You have ${ms(time,{long:true})} [${ms(endTime-Date.now())} remaining]`);
            await botMessage.edit({
              embeds:[embed],
              components:[row],
              content:null
            });
            const startQuestion=Date.now();
            const collector=botMessage.createMessageComponentCollector({time});
            collector.on("collect",button=>{
              if(!players.includes(button.user.id))return;
              button.deferUpdate();
              const responseIndex=parseFloat(button.customId.slice(6));
              userResponses.find(res=>res.author==button.user.id).choice=responseIndex;
              userResponses.find(res=>res.author==button.user.id).time=startQuestion-Date.now()+time;
              embed.setDescription(`You have ${ms(time,{long:true})} [${ms(endTime-Date.now())} remaining]`);
              embed.fields[4].value=userResponses.sort((a,b)=>b.score-a.score).map(res=>`${message.guild.members.cache.get(res.author).user} ${res.choice!=null?"<:None:870024851803492433>":"<a:Loading:867315391939477514>"}`).join("\n");
              botMessage.edit({embeds:[embed]});
              var allDone=true;
              userResponses.forEach(res=>{
                if(res.choice==null)allDone=false;
              });
              if(allDone){
                collector.stop();
                setTimeout(()=>{
                  function timeToscore(val){
                    return Math.round(val/(time/1e3));
                  };
                  embed.fields[4].value=userResponses.sort((a,b)=>b.score-a.score).map(res=>`${message.guild.members.cache.get(res.author).user} ${res.choice!=null?answers[res.choice]==HTMLEncodeDecode.decode(correct_answer)?`<:On:870024897315880991> + ${timeToscore(res.time)} (${res.score+timeToscore(res.time)})`:`<:off:869978532489617458> + 0 (${res.score})`:"<a:Loading:867315391939477514>"}`).join("\n");
                  botMessage.edit({embeds:[embed]});
                  userResponses.forEach(res=>{
                    if(answers[res.choice]==HTMLEncodeDecode.decode(correct_answer))res.score+=timeToscore(res.time);
                    res.choice=null;
                    res.time=0;
                  });
                  setTimeout(()=>{
                    turn--;
                    playTurn();
                  },2e3);
                },2e3);
              };
            });
          };
        };
      }).catch(()=>message.channel.send("An error has occured."));
    });
  },
  name:"quiz",
  aliases:["trivia"],
  description:"Several questions will be asked, the player with the most score wins the game. Please note that the time it takes to answer the questions also counts in the calculation of the score. The fastest to answer the right question will be the winner. If you play alone, you need to have a higher score than 3000.",
  category:"game",
  shortRules:"To play a quiz",
  exemples:`\`${process.env.BOT_PREFIX}quiz\` <- no args required`,
  gameName:"Quiz",
  icon:"https://i.imgur.com/mlfJ1kS.png",
  cooldown:1.5e4
};