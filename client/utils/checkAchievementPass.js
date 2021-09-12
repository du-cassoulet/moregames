const db=require("quick.db");
const utils=require("../utils/utils");
function checkAchiePass({userId,guild}){
  if(!db.get(userId))return;
  var achievements=require("../../public/json/achievements.json");
  const highestGame={
    victories:{count:0},
    defeats:{count:0},
    played:{count:0}
  };
  var victories=0;
  var defeats=0;
  Object.entries(db.get(`${userId}.games`)).forEach(result=>{
    const[gameName,results]=result;
    defeats+=results[0];
    victories+=results[1];
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
          progress:db.get(`${userId}.games.${highestGame.victories.game}[1]`),
          needed:achievement.parameters.victories
        };
        else progress_bar={
          progress:db.get(`${userId}.games.${achievement.parameters.game}[1]`),
          needed:achievement.parameters.victories
        };
      }else progress_bar={
        progress:victories,
        needed:achievement.parameters.victories
      };
    }else if(achievement.parameters.defeats){
      if(achievement.parameters.game){
        if(achievement.parameters.game=="[highest]")progress_bar={
          progress:db.get(`${userId}.games.${highestGame.defeats.game}[0]`),
          needed:achievement.parameters.defeats
        };
        else progress_bar={
          progress:db.get(`${userId}.games.${achievement.parameters.game}[0]`),
          needed:achievement.parameters.defeats
        };
      }else progress_bar={
        progress:defeats,
        needed:achievement.parameters.defeats
      };
    }else if(achievement.parameters.tokens){
      progress_bar={
        progress:db.get(`${userId}.tokens`),
        needed:achievement.parameters.tokens
      };
    };
    if(utils.numberWithCommas(progress_bar.progress).length>neededSpace[0])neededSpace[0]=utils.numberWithCommas(progress_bar.progress).length;
    if(utils.numberWithCommas(progress_bar.needed).length>neededSpace[1])neededSpace[1]=utils.numberWithCommas(progress_bar.needed).length;
    return{progress_bar,...achievement};
  });
  achievements.forEach((achievement,id)=>{
    if(achievement.progress_bar.progress>=achievement.progress_bar.needed){
      if(db.includes(`${userId}.achievements`,numToZero(3-id.toString().length)+id.toString()))return;
      db.push(`${userId}.achievements`,numToZero(3-id.toString().length)+id.toString());
      db.add(`${userId}.tokens`,achievement.reward);
      guild.members.cache.get(userId).send({
        content:`🎁 New achievement get **${achievement.name}** (+ ${achievement.reward} tokens)`
      });
    };
  });
};
function numToZero(num){
  var str="";
  for(let i=0;i<num;i++)str+="0";
  return str;
};
module.exports=checkAchiePass;