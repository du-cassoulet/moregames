const Discord=require("discord.js");
const utils=require("../utils/utils");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({client,message})=>{
    const start=Date.now();
    await client.channels.cache.get("886339792785264640").send(start.toString());
    message.reply({content:`:ping_pong: Pong! **${(utils.numberWithCommas(Date.now()-start))}** milliseconds`});
  },
  name:"ping",
  description:"",
  category:"utility",
  shortRules:"",
  exemples:`\`${process.env.BOT_PREFIX}ping\` <- no args required`,
  cooldown:1e3
};