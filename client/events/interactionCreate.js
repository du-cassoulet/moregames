const Discord=require("discord.js");
module.exports={
  event:"interactionCreate",
  once:false,
  disabled:false,
  /**
   * @param {Discord.Client} client 
   * @param {Discord.Interaction} interaction 
   */
  func:async(client,interaction)=>{
    if(!interaction.isButton())return;
    if(interaction.customId.startsWith("res")){
      interaction.deferUpdate();
      const gameName=interaction.customId.slice(3);
      interaction.message.author=interaction.user;
      if(client.commands.has(gameName))client.commands.get(gameName).func({client,message:interaction.message});
    };
  }
};