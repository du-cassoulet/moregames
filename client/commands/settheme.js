const Discord=require("discord.js");
const db=require("quick.db");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({message,args})=>{
    const themeList=Object.keys(require("../../public/json/styles.json"));
    if(!args.length||!themeList.includes(args[0]))return message.reply({content:`You have to input a correct theme: [${themeList.join(", ")}]`});
    db.set(`${message.author.id}-theme`,args[0]);
    message.reply({content:`Successfully chosen the theme **${db.get(`${message.author.id}-theme`)}**`});
  },
  name:"settheme",
  aliases:["setstyle","st","ss"],
  description:"To set your game theme",
  category:"utility",
  shortRules:"To set your game theme",
  exemples:`\`${process.env.BOT_PREFIX}settheme\` <- theme name`,
  cooldown:1.5e3
};