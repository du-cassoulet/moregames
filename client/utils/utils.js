const db=require("quick.db");
function shuffle(a){
  var j,x,i;
  for(i=a.length-1;i>0;i--){
      j=Math.floor(Math.random()*(i+1));
      x=a[i];
      a[i]=a[j];
      a[j]=x;
  };
  return a;
};
function device(user){
  const[desktop,mobile,web]=[
      {id:0,presence:"desktop"},
      {id:1,presence:"mobile"},
      {id:2,presence:"web"}
  ];
  const status=["online","dnd","idle"];
  if(!user.presence.clientStatus)return desktop;
  if(user.presence.clientStatus.web&&status.includes(user.presence.clientStatus.web))return web;
  if(user.presence.clientStatus.mobile&&status.includes(user.presence.clientStatus.mobile))return mobile;
  if(user.presence.clientStatus.desktop&&status.includes(user.presence.clientStatus.desktop))return desktop;
  return desktop;
};
function arraysEqual(a,b){
  if(a==b)return true;
  if(a==null||b==null)return false;
  if(a.length!=b.length)return false;
  for(let i=0;i<a.length;++i){
    if(a[i]!=b[i])return false;
  };
  return true;
};
function addTokens(userId,isVictory){
  const userLevel=db.get(`${userId}.level`);
  const defaultTokens=isVictory?10:5;
  const tokensMultiplicator=(userLevel/isVictory?.75:.5)*Math.floor(Math.random()*50)+50;
  const addedTokens=Math.floor(defaultTokens*tokensMultiplicator);
  db.add(`${userId}.tokens`,addedTokens);
  return addedTokens;
};
function addExp(userId,isVictory){
  const addedExp=isVictory?Math.floor(Math.random()*75)+75:Math.floor(Math.random()*50)+25;
  db.add(`${userId}.xp`,addedExp);
  var addedLevel=0;
  if(db.get(`${userId}.xp`)>=500*(db.get(`${userId}.level`)||1)){
    const xpDiff=db.get(`${userId}.xp`)-500*(db.get(`${userId}.level`)||1);
    db.add(`${userId}.level`,1);
    db.set(`${userId}.xp`,xpDiff);
    addedLevel++;
  };
  return{addedExp,addedLevel};
};
function addCommand(commandName,isGame){
  if(!db.has("commands"))db.set("commands",{notGame:{},game:{}});
  if(!db.has(`commands.${isGame?"game":"notGame"}.${commandName}`))return db.set(`commands.${isGame?"game":"notGame"}.${commandName}`,1);
  else return db.add(`commands.${isGame?"game":"notGame"}.${commandName}`,1);
};
function loopIdGetter(arr,index){
  const loopNumber=Math.floor(index/arr.length);
  return arr[index-arr.length*loopNumber];
};
function numberWithCommas(x){
  if(!x)return""+x;
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");
};
function userStyle(userId){
  const themes=require("../../public/json/styles.json");
  if(!db.get(`${userId}-theme`))return themes.main_theme;
  else return themes[db.get(`${userId}-theme`)];
};
module.exports={device,shuffle,arraysEqual,addTokens,addCommand,loopIdGetter,numberWithCommas,addExp,userStyle};