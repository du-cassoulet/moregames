const db=require("quick.db");
function createUser({client,userId}){
  if(!db.has(userId)){
    db.set(userId,{
      tokens:500,
      level:1,
      xp:0,
      games:{},
      achievements:[]
    });
    client.commands.filter(command=>command.category=="game").forEach(game=>{
      db.set(`${userId}.games.${game.name}`,[0,0]);
    });
  };
};
module.exports=createUser;