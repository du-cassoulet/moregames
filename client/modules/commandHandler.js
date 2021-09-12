const fs=require("fs");
module.exports=client=>{
  const commandFiles=fs.readdirSync("./client/commands/").filter(file=>file.endsWith(".js"));
  commandFiles.forEach(file=>{
    const command=require(`../commands/${file}`);
    command.file=file;
    client.commands.set(command.name,command);
    if(command.aliases){
      if(typeof command.aliases=="string")command.aliases=[command.aliases];
      command.aliases.forEach(alias=>{
        client.aliases.set(alias,command.name);
      });
    }
  });
};