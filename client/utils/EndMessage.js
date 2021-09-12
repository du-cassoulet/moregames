const Discord=require("discord.js");
const utils=require("./utils");
const Game=require("./Game");
const ms=require("ms");
const db=require("quick.db");
const checkAchievementPass=require("./checkAchievementPass");
class EndMessage{
  constructor({winners,losers,reason,channel,game,rules,gameStart,hostId}){
    this.winners=winners;
    this.losers=losers;
    this.reason=reason;
    this.game=game;
    this.channel=channel;
    this.guild=channel.guild;
    this.rules=rules;
    this.gameStart=gameStart;
    this.hostId=hostId;
  };
  send(){
    (async()=>{
      new Game.Delete({client,gameId:this.hostId});
      const reason=await require("./textToImage")(this.reason);
      const restart=new Discord.MessageButton().setCustomId(`res${this.game}`).setStyle("PRIMARY").setEmoji("🔄").setLabel("Restart");
      const embed=new Discord.MessageEmbed()
      .setColor(utils.userStyle(this.hostId).main_color)
      .setFooter(`Click on "🔄 Restart" to restart a new game`)
      .setDescription(`:newspaper: **Rules:**\n${this.rules}`)
      .setImage("attachment://reason.jpg");
      if(this.winners&&this.winners.length>0)embed.addField(this.winners.length>1?"Winners":"Winner",this.winners.map(ui=>this.guild.members.cache.get(ui).user).join("\n"),true);
      if(this.losers&&this.losers.length>0)embed.addField(this.losers.length>1?"Losers":"Loser",this.losers.map(ui=>this.guild.members.cache.get(ui).user).join("\n"),true);
      const gameDuration=Date.now()-this.gameStart;
      if(!db.has("gametimespent"))db.set("gametimespent",gameDuration);
      else db.add("gametimespent",gameDuration);
      const content={
        content:`:joystick: The game **${this.game}** ended.\nGame duration: **${ms(gameDuration,{long:true})}**`,
        embeds:[embed],
        files:[
          new Discord.MessageAttachment(reason,"reason.jpg")
        ],
        components:[
          new Discord.MessageActionRow().addComponents(restart)
        ]
      };
      this.channel.send(content);
      if(this.winners&&this.winners.length>0)this.winners.forEach(async winnerId=>{
        if(winnerId==this.channel.client.user.id)return;
        db.add(`${winnerId}.games.${this.game}[1]`,1);
        const cardBuffer=await require("./lvlCard")({
          isVictory:true,
          member:this.guild.members.cache.get(winnerId)
        });
        this.guild.members.cache.get(winnerId).send({
          content:`:joystick: **${this.game}** exp`,
          files:[
            new Discord.MessageAttachment(cardBuffer,"exp-card.jpg")
          ]
        });
        checkAchievementPass({userId:winnerId,guild:this.guild});
      });
      if(this.losers&&this.losers.length>0)this.losers.forEach(async loserId=>{
        if(loserId==this.channel.client.user.id)return;
        db.add(`${loserId}.games.${this.game}[0]`,1);
        const cardBuffer=await require("./lvlCard")({
          isVictory:false,
          member:this.guild.members.cache.get(loserId)
        });
        this.guild.members.cache.get(loserId).send({
          content:`:joystick: **${this.game}** exp`,
          files:[
            new Discord.MessageAttachment(cardBuffer,"exp-card.jpg")
          ]
        });
        checkAchievementPass({userId:loserId,guild:this.guild});
      });
    })();
  };
};
module.exports=EndMessage;