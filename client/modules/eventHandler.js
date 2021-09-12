const fs=require("fs");
module.exports=client=>{
  const eventFiles=fs.readdirSync("./client/events/").filter(file=>file.endsWith(".js"));
  eventFiles.forEach(file=>{
    const eventFunction=require(`../events/${file}`);
    if(eventFunction.disabled)return;
    const event=eventFunction.event||file.split(".")[0];
    const emitter=(typeof eventFunction.emitter=="string"?client[eventFunction.emitter]:eventFunction.emitter)||client;
    const once=eventFunction.once;
    try{
      emitter[once?"once":"on"](event,(...args)=>eventFunction.func(client,...args));
    }catch(error){
      console.error(error.stack);
    };
  });
};