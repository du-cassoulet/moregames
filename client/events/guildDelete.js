const db=require("quick.db");
module.exports={
  event:"guildDelete",
  once:false,
  disabled:false,
  func:async(_,guild)=>{
    await db.delete(`${guild.id}-prefix`);
    global.logger.database(`Left ${guild.name}, saved to the db.`);
  }
};