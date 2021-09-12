require("dotenv").config();
const Discord=require("discord.js");
const client=new Discord.Client({
  intents:[
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_INTEGRATIONS
  ]
});
client.options.restTimeOffset=0;
client.commands=new Discord.Collection();
client.aliases=new Discord.Collection();
client.games=new Discord.Collection();
client.inGame=new Discord.Collection();
global.client=client;
global.logger=require("../miscellaneous/logger");
(async()=>{
  await client.login(process.env.BOT_TOKEN);
  require("./modules/eventHandler")(client);
  require("./modules/commandHandler")(client);
  global.logger.infos(`Logged as ${client.user.tag}`);
})();