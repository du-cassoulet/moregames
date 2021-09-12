require("colors");
module.exports={
  infos:str=>console.log(`[Infos: ${new Date().toString().split(" ",5).join(" ")}] ${str}`.gray),
  status:str=>console.log(`[Status: ${new Date().toString().split(" ",5).join(" ")}] ${str}`.magenta),
  database:str=>console.log(`[Database: ${new Date().toString().split(" ",5).join(" ")}] ${str}`.yellow)
};