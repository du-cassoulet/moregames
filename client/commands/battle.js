const Discord=require("discord.js");
const Lobby=require("../utils/Lobby");
const utils=require("../utils/utils");
const EndMessage=require("../utils/EndMessage");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({message})=>{
    const lobby=new Lobby({
      game:module.exports.gameName,
      icon:module.exports.icon,
      rules:module.exports.description,
      hostId:message.author.id,
      message:message,
      maxPlayers:8,
      minPlayers:2
    });
    lobby.start(async players=>{
      const startDate=new Date();
      var end=false;
      const allPlayer=[...players];
      const inGamePlayers=players.map(playerId=>{
        return{
          id:playerId,
          health:500
        };
      });
      var turnIndex=0;
      const userTurn=()=>utils.loopIdGetter(inGamePlayers,turnIndex);
      var consecutiveInactivity=0;
      playTurn();
      function checkEnd(){
        if(inGamePlayers.length==1){
          new EndMessage({
            hostId:message.author.id,
            channel:message.channel,
            game:module.exports.gameName,
            losers:allPlayer.filter(playerId=>playerId!=inGamePlayers[0].id),
            winners:[inGamePlayers[0].id],
            reason:`The last man standing is ${message.guild.members.cache.get(inGamePlayers[0].id).user.username}`,
            rules:module.exports.description,
            gameStart:startDate
          }).send();
          return true;
        };
        return false;
      };
      function embed(){
        const embed=new Discord.MessageEmbed();
        embed.setColor(utils.userStyle(message.author.id).main_color);
        embed.setDescription(`${inGamePlayers.map(player=>`- ${message.guild.members.cache.get(player.id).user.username}: ${player.health>0?`${player.health}hp`:"\\💀"}`).join("\n")}`);
        embed.setAuthor("📈 Game stats");
        return embed;
      };
      async function playTurn(){
        const filter=m=>m.content.toLowerCase().startsWith("atk")||m.author.id==userTurn().id;
        const collector=message.channel.createMessageCollector({time:1.5e4,filter});
        await message.channel.send(`It is the ${message.guild.members.cache.get(userTurn().id).user.username}'s turn`);
        collector.on("collect",async atkMessage=>{
          /**
           * @param {{
           *  damages:()=>Number,
           *  critical:{chances:Number,multiplicator:Number}
           * }} tool 
           * @param {{
           *  id:String,
           *  health:Number
           * }} user 
           */
          function attack(tool,user){
            critical=val=>Math.floor(Math.random()*100)<val;
            const isCritical=critical(tool.critical.chances);
            var damages=tool.damages();
            if(isCritical)damages=Math.round(damages*tool.critical.multiplicator);
            user.health+=damages;
            var isDead=false
            if(user.health<0){
              user.health=0;
              isDead=true;
              inGamePlayers.splice(inGamePlayers.findIndex(player=>player.id==user.id),1);
            };
            return{damages,isCritical,isDead};
          };
          consecutiveInactivity=0;
          const[tool]=atkMessage.content.trim().split(/ +/g).slice(1);
          const tools={
            knife:{damages:()=>(Math.floor(Math.random()*50)+50)*-1,critical:{chances:20,multiplicator:1.5}},
            sword:{damages:()=>Math.floor(Math.random()*100)*-1,critical:{chances:50,multiplicator:1.2}},
            gun:{damages:()=>(Math.floor(Math.random()*9)+1)*-1,critical:{chances:50,multiplicator:10}},
            kit:{damages:()=>Math.floor(Math.random()*75)+25,critical:{chances:0,multiplicator:0}}
          };
          if(!tools[tool])return message.reply({content:`The attack command must be formuled like: atk [<tool>] [<user-mention>]\nTools are: ${Object.keys(tools).join(", ")}`});
          if(!atkMessage.mentions.users.size)return message.reply({content:`You have to mention someone to attack him.`});
          if(atkMessage.mentions.users.size>1)return message.reply({content:`You can mention only one user.`});
          var user=atkMessage.mentions.users.first();
          if(!allPlayer.includes(user.id)){
            if(atkMessage.deletable)atkMessage.delete();
            return message.reply({content:`${user.username} is not in this game`});
          };
          if(!inGamePlayers.find(player=>player.id==user.id))return message.reply({content:`${user} is already dead.`});
          user=inGamePlayers.find(player=>player.id==user.id);
          const attackResult=attack(tools[tool],user);
          await message.channel.send({
            content:`${attackResult.isDead?`You killed ${message.guild.members.cache.get(user.id).user} (${attackResult.damages>0?`+${attackResult.damages}`:attackResult.damages} ${attackResult.isCritical?"critical":""} damages)`:`You done ${attackResult.damages>0?`+${attackResult.damages}`:attackResult.damages} to ${message.guild.members.cache.get(user.id).user} ${attackResult.isCritical?"(critical)":""}`}`,
            embeds:[embed()]
          });
          collector.stop();
          turnIndex++;
          if(!end){
            end=checkEnd();
            if(end)return;
            else return playTurn();
          };
        });
        collector.on("end",collected=>{
          if(!collected.size){
            message.channel.send({
              content:`${message.guild.members.cache.get(userTurn().id).user} You didn't attack anyone during your turn`
            });
            consecutiveInactivity++;
            if(consecutiveInactivity>3){
              end=true;
              return new EndMessage({
                hostId:message.author.id,
                channel:message.channel,
                game:module.exports.gameName,
                losers:allPlayer,
                reason:`The game ended due to inactivity`,
                rules:module.exports.description,
                gameStart:startDate
              }).send();
            }else{
              turnIndex++;
              playTurn();
            };
          };
        });
      };
    });
  },
  name:"battle",
  aliases:["lastmanstanding","battleroyale","lms","br","attack"],
  description:"Les joueurs doivent attaquer avec plusieurs armes dont une épée, un couteau et un pistolet. Le joueur peut aussi faire le choix de se soigner ou de soigner un de ses amis. Le dernier joueur restant est le gagnant.",
  category:"game",
  shortRules:"To play to the battle",
  exemples:`\`${process.env.BOT_PREFIX}battle\` <- no args required`,
  gameName:"Battle",
  icon:"https://i.imgur.com/OtpC3Gl.png",
  cooldown:1.5e4
};