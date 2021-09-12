const Discord=require("discord.js");
const textToImage=require("./textToImage");
const Game=require("./Game");
const utils=require("./utils");
class Lobby{
  constructor({hostId,message,game,rules,minPlayers,maxPlayers,gamemodes,icon}){
    this.hostId=hostId;
    this.game=game;
    this.rules=rules;
    this.message=message;
    this.channel=message.channel;
    this.guild=message.channel.guild;
    this.minPlayers=minPlayers;
    this.maxPlayers=maxPlayers;
    this.gamemodes=gamemodes;
    this.icon=icon;
  };
  start(callback){
    (async()=>{
      if(this.message.client.games.has(this.hostId)||this.message.client.inGame.has(this.hostId))return this.channel.send({content:"You can't start this game because you are already playing to another one."});
      new Game.Create({
        client:this.message.client,
        gameId:this.hostId,
        minPlayers:this.minPlayers,
        channelId:this.channel.id,
        gameName:this.game,
        gameStart:Date.now(),
        starting:true
      });
      const joinButton=new Discord.MessageButton().setCustomId("join").setStyle("SUCCESS").setLabel("Join lobby");
      const leaveButton=new Discord.MessageButton().setCustomId("leave").setStyle("DANGER").setLabel("Leave lobby");
      const startGame=new Discord.MessageButton().setLabel("Start").setCustomId("start").setStyle("SECONDARY").setDisabled(this.minPlayers==1?false:true);
      const cancelGame=new Discord.MessageButton().setLabel("Cancel").setCustomId("cancel").setStyle("SECONDARY");
      const settings=new Discord.MessageButton().setLabel("Mode").setEmoji("🔧").setCustomId("settings").setStyle("SECONDARY").setDisabled(this.gamemodes?false:true);
      const players=[this.hostId];
      const lobbyMessage=await this.channel.send({
        content:`${this.guild.members.cache.get(this.hostId).user.username} is hosting a ${this.game}\n:busts_in_silhouette: **Players:** ${players.map(userId=>this.guild.members.cache.get(userId).user).join(", ")}\n**${players.length>=this.minPlayers?"No":(this.minPlayers-players.length).toString()}** more player${this.minPlayers-players.length>1?"s":""} needed`,
        embeds:[
          new Discord.MessageEmbed()
          .setDescription(this.rules)
          .setColor(utils.userStyle(this.message.author.id).main_color)
          .setThumbnail(this.icon)
        ],
        components:[
          new Discord.MessageActionRow()
          .addComponents(joinButton,leaveButton,startGame,cancelGame,settings)
        ]
      });
      function refreshMessage(message){
        message.edit({
          content:message.content,
          embeds:message.embeds,
          components:message.components
        });
      };
      const collector=lobbyMessage.createMessageComponentCollector({time:3e5});
      var selectedGamemode;
      var inChoice;
      collector.on("collect",button=>{
        if(button.customId=="join"){
          button.deferUpdate();
          if(players.includes(button.user.id))return;
          if(players.length>=this.maxPlayers)return this.channel.send({
            embeds:[
              new Discord.MessageEmbed()
              .setAuthor(`This match can have up to ${this.maxPlayers} players.`)
              .setDescription(`Do the command ${db.get(`${message.guild}-prefix`)}help to see the command stats.`)
              .setColor(utils.userStyle(button.user.id).main_color)
            ]
          });
          if(this.message.client.games.has(button.user.id)||this.message.client.inGame.has(button.user.id))return this.channel.send({content:"You can't join this game because you are already playing to another one."});
          players.push(button.user.id);
          new Game.AddPlayer({client:this.message.client,gameId:this.hostId,userId:button.user.id});
          lobbyMessage.content=`${this.guild.members.cache.get(this.hostId).user.username} is hosting a ${this.game}\n:busts_in_silhouette: **Players:** ${players.map(userId=>this.guild.members.cache.get(userId).user).join(", ")}\n**${players.length>=this.minPlayers?"No":(this.minPlayers-players.length).toString()}** more player${this.minPlayers-players.length>1?"s":""} needed`;
          if(players.length>=this.minPlayers)lobbyMessage.components[0].components[2].setDisabled(false);
          refreshMessage(lobbyMessage);
        }else if(button.customId=="leave"){
          button.deferUpdate();
          if(button.user.id==this.hostId)return;
          if(!players.includes(button.user.id))return;
          players.splice(players.indexOf(button.user.id),1);
          new Game.RemovePlayer({client:this.message.client,userId:button.user.id});
          lobbyMessage.content=`${this.guild.members.cache.get(this.hostId).user.username} is hosting a ${this.game}\n:busts_in_silhouette: **Players:** ${players.map(userId=>this.guild.members.cache.get(userId).user).join(", ")}\n**${players.length>=this.minPlayers?"No":(this.minPlayers-players.length).toString()}** more player${this.minPlayers-players.length>1?"s":""} needed`;
          refreshMessage(lobbyMessage);
        }else if(button.customId=="start"){
          button.deferUpdate();
          if(button.user.id!=this.hostId)return;
          collector.stop();
          client.games.get(this.hostId).starting=false;
          callback.bind(this)(client.games.get(this.hostId).players,lobbyMessage,selectedGamemode);
        }else if(button.customId=="cancel"){
          button.deferUpdate();
          if(button.user.id!=this.hostId)return;
          collector.stop();
          new Game.Delete({client:this.message.client,gameId:this.hostId});
          if(lobbyMessage.deletable)lobbyMessage.delete();
        }else if(button.customId=="settings"){
          button.deferUpdate();
          this.gamemodes=this.gamemodes.map(gamemode=>{
            gamemode.value=gamemode.label.toLowerCase().replace(/[ \-_]/g,"_");
            gamemode.custom_id=gamemode.label.toLowerCase().replace(/[ \-_]/g,"_");
            return gamemode;
          });
          lobbyMessage.edit({
            content:`Select a game mode [${this.gamemodes.map(gm=>gm.label).join(", ")}]`,
            embeds:[],
            components:[
              new Discord.MessageActionRow()
              .addComponents(
                new Discord.MessageSelectMenu()
                .setCustomId("gamemode")
                .setPlaceholder("Nothing selected")
                .addOptions(this.gamemodes)
              ),
              new Discord.MessageActionRow()
              .addComponents(
                new Discord.MessageButton()
                .setLabel("Select")
                .setStyle("SUCCESS")
                .setCustomId("select-selector"),
                new Discord.MessageButton()
                .setLabel("Cancel")
                .setStyle("SECONDARY")
                .setCustomId("cancel-selector")
              ),
            ]
          });
        }else if(button.customId=="gamemode"){
          button.deferUpdate();
          inChoice=button.values[0];
        }else if(button.customId=="select-selector"){
          button.deferUpdate();
          selectedGamemode=inChoice;
          lobbyMessage.content=`${this.guild.members.cache.get(this.hostId).user.username} is hosting a ${this.game}\n:busts_in_silhouette: **Players:** ${players.map(userId=>this.guild.members.cache.get(userId).user).join(", ")}\n**${players.length>=this.minPlayers?"No":(this.minPlayers-players.length).toString()}** more player${this.minPlayers-players.length>1?"s":""} needed`;
          refreshMessage(lobbyMessage);
        }else if(button.customId=="cancel-selector"){
          button.deferUpdate();
          lobbyMessage.content=`${this.guild.members.cache.get(this.hostId).user.username} is hosting a ${this.game}\n:busts_in_silhouette: **Players:** ${players.map(userId=>this.guild.members.cache.get(userId).user).join(", ")}\n**${players.length>=this.minPlayers?"No":(this.minPlayers-players.length).toString()}** more player${this.minPlayers-players.length>1?"s":""} needed`;
          refreshMessage(lobbyMessage);
        };
      });
      collector.on("end",async collected=>{
        if(!collected.filter(component=>component.customId=="start"||component.customId=="cancel").size){
          const textBuffer=await textToImage("The game timed out.");
          const attachment=new Discord.MessageAttachment(textBuffer,"reason.jpg");
          this.message.reply({
            content:`The game ${this.game} has stopped`,
            files:[attachment]
          });
        };
      });
    })();
  };
};
module.exports=Lobby;