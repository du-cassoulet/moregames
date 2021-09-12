const Canvas=require("canvas");
module.exports=str=>{
  return new Promise((resolve,reject)=>{
    try{
      const canvas=new Canvas.createCanvas(500,28);
      const ctx=canvas.getContext("2d");
      ctx.fillStyle="black";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.font="20px Verdana";
      ctx.fillStyle="white";
      const textString=str;
      const textWidth=ctx.measureText(textString).width;
      ctx.fillText(textString,(canvas.width/2)-(textWidth/2),22);
      resolve(canvas.toBuffer());
    }catch(error){
      reject(error);
    };
  });
};