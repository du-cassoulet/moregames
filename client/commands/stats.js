const Discord=require("discord.js");
const AsciiTable=require("ascii-table");
const db=require("quick.db");
const utils=require("../utils/utils");
const table=new AsciiTable();
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({message,args})=>{
    const member=message.mentions.members.first()||message.guild.members.cache.get(args[0])||message.member;
    var defeats=0;
    var victories=0;
    table.removeBorder();
    table.setHeading("Game","Games played","Victories","Defeats","Ratio");
    Object.entries(db.get(`${member.id}.games`)).forEach(result=>{
      const[gameName,results]=result;
      defeats+=results[0]||0;
      victories+=results[1]||0;
      var ratio=results[1]/results[0];
      if(ratio==Infinity||isNaN(ratio))ratio="- -";
      if(ratio!="- -")ratio=utils.numberWithCommas(Math.round(ratio*100)/100);
      if(results[0]!=0||results[1]!=0)table.addRow(gameName,utils.numberWithCommas(results[1]+results[0]),utils.numberWithCommas(results[1]),utils.numberWithCommas(results[0]),ratio);
    });
    message.reply({content:`\`\`\`\n${table}\n\`\`\``});
  },
  name:"stats",
  description:"To view someone stats",
  category:"infos",
  shortRules:"To view someone stats",
  exemples:`\`${process.env.BOT_PREFIX}stats\` <- no mentions
\`${process.env.BOT_PREFIX}stats\` <- member mention
\`${process.env.BOT_PREFIX}stats\` <- member id`,
  cooldown:1e3
};