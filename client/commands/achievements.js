const Discord=require("discord.js");
const db=require("quick.db");
const utils=require("../utils/utils");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({message})=>{
    var achievements=require("../../public/json/achievements.json");
    achievements=achievements.filter((_,index)=>{
      const arr=(db.get(`${message.author.id}.achievements`)||[]).map(id=>{
        return parseInt(id);
      });
      return!arr.includes(index)
    });
    if(!achievements.length)return message.reply({content:"You done every possible achievements!"});
    achievements=achievements.sort((a,b)=>a.reward-b.reward);
    var victories=0;
    var defeats=0;
    const highestGame={
      victories:{count:0},
      defeats:{count:0},
      played:{count:0}
    };
    function toProgressBar(num,max){
      const tileNumber=Math.round((num*20)/max);
      const voidNumber=20-tileNumber;
      const[tile,voidChar]=["■","□"];
      var str="";
      for(let i=0;i<tileNumber;i++)str+=tile;
      for(let i=0;i<voidNumber;i++)str+=voidChar;
      return`|${str}|`;
    };
    Object.entries(db.get(`${message.author.id}.games`)).forEach(result=>{
      const[gameName,results]=result;
      defeats+=results[0]||0;
      victories+=results[1]||0;
      if(!highestGame.victories.count)highestGame.victories={game:gameName,count:0};
      if(!highestGame.defeats.count)highestGame.defeats={game:gameName,count:0};
      if(!highestGame.played.count)highestGame.played={game:gameName,count:0};
      if(highestGame.victories.count<results[1])highestGame.victories={game:gameName,count:results[1]};
      if(highestGame.defeats.count<results[0])highestGame.defeats={game:gameName,count:results[0]};
      if(highestGame.played.count<results[0]+results[1])highestGame.played={game:gameName,count:results[0]+results[1]};
    });
    var neededSpace=[0,0];
    achievements=achievements.map(achievement=>{
      var progress_bar=0;
      if(achievement.parameters.victories){
        if(achievement.parameters.game){
          if(achievement.parameters.game=="[highest]")progress_bar={
            progress:db.get(`${message.author.id}.games.${highestGame.victories.game}[1]`),
            needed:achievement.parameters.victories
          };
          else progress_bar={
            progress:db.get(`${message.author.id}.games.${achievement.parameters.game}[1]`),
            needed:achievement.parameters.victories
          };
        }else progress_bar={
          progress:victories,
          needed:achievement.parameters.victories
        };
      }else if(achievement.parameters.defeats){
        if(achievement.parameters.game){
          if(achievement.parameters.game=="[highest]")progress_bar={
            progress:db.get(`${message.author.id}.games.${highestGame.defeats.game}[0]`),
            needed:achievement.parameters.defeats
          };
          else progress_bar={
            progress:db.get(`${message.author.id}.games.${achievement.parameters.game}[0]`),
            needed:achievement.parameters.defeats
          };
        }else progress_bar={
          progress:defeats,
          needed:achievement.parameters.defeats
        };
      }else if(achievement.parameters.tokens){
        progress_bar={
          progress:db.get(`${message.author.id}.tokens`),
          needed:achievement.parameters.tokens
        };
      };
      if(utils.numberWithCommas(progress_bar.progress).length>neededSpace[0])neededSpace[0]=utils.numberWithCommas(progress_bar.progress).length;
      if(utils.numberWithCommas(progress_bar.needed).length>neededSpace[1])neededSpace[1]=utils.numberWithCommas(progress_bar.needed).length;
      progress_bar.bar=toProgressBar(progress_bar.progress>progress_bar.needed?progress_bar.needed:progress_bar.progress,progress_bar.needed);
      return{progress_bar,...achievement};
    });
    function numToVoid(num){
      var str="";
      for(let i=0;i<num;i++)str+=" ";
      return str;
    };
    message.reply({
      content:`\`\`\`${achievements.map(achievement=>`${achievement.name}: ${achievement.description}\n ${numToVoid(neededSpace[0]-utils.numberWithCommas(achievement.progress_bar.progress).length)}${utils.numberWithCommas(achievement.progress_bar.progress)} ${achievement.progress_bar.bar} ${utils.numberWithCommas(achievement.progress_bar.needed)}${numToVoid(neededSpace[1]-utils.numberWithCommas(achievement.progress_bar.needed).length+5)} (+ ${utils.numberWithCommas(achievement.reward)} tokens)`).join("\n\n")}\`\`\``
    });
  },
  name:"achievements",
  aliases:["achie"],
  description:"To view every of your achievements",
  category:"infos",
  shortRules:"To view every of your achievements",
  exemples:`\`${process.env.BOT_PREFIX}achievements\` <- no args required`,
  cooldown:1e3
};