const db=require("quick.db");
module.exports={
  event:"guildCreate",
  once:false,
  disabled:false,
  func:async(_,guild)=>{
    await db.set(`${guild.id}-prefix`,process.env.BOT_PREFIX);
    global.logger.database(`Joined ${guild.name}, saved to the db.`);
  }
};