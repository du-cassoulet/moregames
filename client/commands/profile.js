const Discord=require("discord.js");
const Canvas=require("canvas");
const db=require("quick.db");
const utils=require("../utils/utils");
module.exports={
  /**
   * @param {{
   *  client:Discord.Client,
   *  message:Discord.Message,
   *  args:String[]
   * }} param0 
   */
  func:async({message,args})=>{
    const member=message.mentions.members.first()||message.guild.members.cache.get(args[0])||message.member;
    const style=utils.userStyle(member.id);
    Canvas.registerFont("./public/fonts/FjallaOne-Regular.ttf",{family:"FjallaOne"});
    const xp=db.get(`${member.user.id}.xp`)||0;
    const level=db.get(`${member.user.id}.level`)||1;
    const tokens=db.get(`${member.user.id}.tokens`)||0;
    const neededXp=500*level;
    function createImageByURL(imageURL){
      return new Promise(resolve=>{
        const imageBuffer=new Canvas.Image();
        imageBuffer.src=imageURL;
        imageBuffer.onload=function(){
          resolve(imageBuffer);
        };
      });
    };
    const canvas=Canvas.createCanvas(800,250);
    const ctx=canvas.getContext("2d");
    function roundedRect(x,y,width,height,radius) {
      ctx.fillStyle="#21212b";
      ctx.beginPath();
      ctx.moveTo(x,y+radius);
      ctx.lineTo(x,y+height-radius);
      ctx.arcTo(x,y+height,x+radius,y+height,radius);
      ctx.lineTo(x+width-radius,y+height);
      ctx.arcTo(x+width,y+height,x+width,y+height-radius,radius);
      ctx.lineTo(x+width,y+radius);
      ctx.arcTo(x+width,y,x+width-radius,y,radius);
      ctx.lineTo(x+radius,y);
      ctx.arcTo(x,y,x,y+radius,radius);
      ctx.fill();
    };
    ctx.fillStyle="#333345";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#21212b";
    ctx.fillRect(0,0,canvas.width,75);
    ctx.fillStyle="#21212b";
    ctx.fillRect(0,canvas.height-55,canvas.width,canvas.height);
    ctx.textAlign="right";
    ctx.font="bold 25px arial";
    ctx.fillRect(canvas.width-ctx.measureText(`Level ${level}`).width-30,canvas.height-87,canvas.width,canvas.height);
    ctx.fillStyle="white";
    ctx.fillText(`Level ${level}`,canvas.width-10,canvas.height-60);
    ctx.fillStyle=style.profile_background;
    ctx.fillRect(0,canvas.height-50,canvas.width,canvas.height-10);
    ctx.fillStyle=style.profile_xpbar;
    ctx.fillRect(0,canvas.height-50,Math.round(canvas.width*xp/neededXp),canvas.height-10);
    ctx.font="bold 35px arial";
    ctx.fillStyle="#21212b";
    ctx.fillText(`${utils.numberWithCommas(xp)} / ${utils.numberWithCommas(neededXp)} xp`,canvas.width-10,canvas.height-15);
    ctx.textAlign="left";
    ctx.font="small-caps bold 40px arial";
    ctx.fillStyle="white";
    if(ctx.measureText(member.user.username).width>350){
      let convenientText=member.user.username;
      for(let i=0;ctx.measureText(convenientText.slice(0,(i+1)*-1)).width>=300;i++){
        convenientText=convenientText.slice(0,(i+1)*-1);
      };
      ctx.fillText(`${convenientText}... #${member.user.discriminator}`,210,55);
    }else ctx.fillText(member.user.tag,210,55);
    const avatarImage=await createImageByURL(member.user.displayAvatarURL({format:"png",size:2048}));
    ctx.drawImage(avatarImage,6,6,188,188);
    roundedRect(210,85,435,100,10);
    const tokenIcon=await createImageByURL("https://i.imgur.com/kCdbo0c.png");
    ctx.drawImage(tokenIcon,225,canvas.height-160,100,100);
    ctx.font="50px FjallaOne";
    ctx.fillStyle="#fff8";
    ctx.textAlign="right";
    ctx.fillText(utils.numberWithCommas(tokens),canvas.width-165,canvas.height-90);
    ctx.lineWidth=5;
    ctx.strokeStyle="#21212b";
    ctx.strokeRect(-5,-5,200,200);
    ctx.lineWidth=10;
    ctx.strokeStyle="#21212b";
    ctx.strokeRect(0,0,canvas.width,canvas.height);
    const statusImages={
      online:"https://i.imgur.com/PPgsZ6n.png",
      idle:"https://i.imgur.com/IPZCvL2.png",
      dnd:"https://i.imgur.com/ziRf2as.png",
      offline:"https://i.imgur.com/D6lvAeL.png"
    };
    const statusImage=await createImageByURL(statusImages[member.presence?member.presence.status:"offline"]);
    ctx.drawImage(statusImage,canvas.width-75,0,75,75);
    const canvasBuffer=canvas.toBuffer();
    if(!db.has("images"))db.set("images",{});
    if(!db.has("images.weight"))db.set("images.weight",canvasBuffer.byteLength);
    db.add("images.weight",canvasBuffer.byteLength);
    if(!db.has("images.number"))db.set("images.number",1);
    db.add("images.number",1);
    message.channel.send({
      files:[
        new Discord.MessageAttachment(canvasBuffer,"tokens.jpg")
      ]
    })
  },
  name:"profile",
  aliases:["tokens","money"],
  description:"",
  category:"infos",
  shortRules:"",
  exemples:`\`${process.env.BOT_PREFIX}profile\` <- no mentions
\`${process.env.BOT_PREFIX}profile\` <- member mention
\`${process.env.BOT_PREFIX}profile\` <- member id`,
  cooldown:1e3
};