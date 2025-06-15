const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let w = window.innerWidth;
let h = window.innerHeight;
canvas.width = w;
canvas.height = h;

const gravity = 0.6;
const bounceSpeed = -12;
let speedFactor = 1;
let score = 0;
let highscore = parseInt(localStorage.getItem('bbHighScore')||0);
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('highscore');
highEl.textContent = highscore;

let skins = [
  {color:'blue',unlock:0},
  {color:'orange',unlock:10},
  {color:'purple',unlock:20}
];
let currentSkin = parseInt(localStorage.getItem('bbSkin')||0);

const themeSelect = document.getElementById('themeSelect');
function updateThemes(){
  themeSelect.innerHTML='';
  skins.forEach((s,i)=>{
    let opt=document.createElement('option');
    opt.value=i;opt.text=`${s.color} ${highscore>=s.unlock?'':'(locked)'}`;
    if(i===currentSkin)opt.selected=true;
    themeSelect.appendChild(opt);
  });
}
updateThemes();

let dark = false;
const darkBtn = document.getElementById('darkToggle');
darkBtn.onclick = () => {
  document.body.classList.toggle('dark');
  dark=!dark;
};

let gameRunning=false;

// audio setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
let musicOsc;
function beep(f, t=0.1){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value=f; o.connect(g); g.connect(audioCtx.destination);
  o.start();
  g.gain.setValueAtTime(0.2,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+t);
  o.stop(audioCtx.currentTime+t);
}
function startMusic(){
  musicOsc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  musicOsc.type='sine';
  musicOsc.frequency.value=220;
  musicOsc.connect(g); g.connect(audioCtx.destination);
  g.gain.value=0.05;
  musicOsc.start();
}

class Ball{
  constructor(){
    this.r=20;this.x=w/2;this.y=h*0.2;this.vy=0;this.color=skins[currentSkin].color;
  }
  update(){
    this.vy+=gravity*speedFactor;
    this.y+=this.vy;
    if(this.y+this.r>=platform.y&&this.x>platform.x&&this.x<platform.x+platform.w&&this.vy>0){
      if(platform.bad){gameOver();return;}
      this.vy=bounceSpeed*speedFactor;
      score++;
      scoreEl.textContent=score;
      if(score>highscore){
        highscore=score;
        highEl.textContent=highscore;
        localStorage.setItem('bbHighScore',highscore);
        updateThemes();
      }
      if(score%5===0)speedFactor+=0.1;
      beep(440,0.05);
      createParticles(this.x,platform.y);
      nextPlatform();
    }
    if(this.y>h){gameOver();}
  }
  draw(){
    ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();
  }
}

class Platform{
  constructor(){
    this.y=h*0.8;
    this.w=120;
    this.x=Math.random()*(w-this.w);
    this.bad=Math.random()<0.2;
  }
  draw(){
    ctx.fillStyle=this.bad?'red':'green';
    ctx.fillRect(this.x,this.y, this.w, 10);
  }
}

let ball,platform;
let particles=[];
let star=null;

function createParticles(x,y){
  for(let i=0;i<10;i++){
    particles.push({x,y,dx:(Math.random()-0.5)*4,dy:(Math.random()-0.5)*4,life:30});
  }
}

function createStar(){
  star={x:platform.x+platform.w/2,y:platform.y-40,r:8,active:Math.random()<0.5};
}

function updateParticles(){
  particles.forEach(p=>{p.x+=p.dx;p.y+=p.dy;p.life--;});
  particles=particles.filter(p=>p.life>0);
}

function drawParticles(){
  particles.forEach(p=>{ctx.fillStyle='yellow';ctx.fillRect(p.x,p.y,4,4);});
}

function nextPlatform(){
  platform=new Platform();
  platform.w=Math.max(60,120-speedFactor*10);
  createStar();
}

function start(){
  score=0;speedFactor=1;scoreEl.textContent=score;
  ball=new Ball();nextPlatform();gameRunning=true;
  particles=[];
  updateThemes();
  if(audioCtx.state==='suspended')audioCtx.resume();
  if(!musicOsc) startMusic();
  loop();
}

function gameOver(){
  gameRunning=false;
  localStorage.setItem('bbSkin',currentSkin);
  retryBtn.style.display='inline';
  beep(110,0.3);
  if(musicOsc){musicOsc.stop();musicOsc=null;}
}

function loop(){
  if(!gameRunning)return;
  ctx.clearRect(0,0,w,h);
  ball.update();
  platform.draw();
  if(star && star.active){
    ctx.fillStyle='yellow';
    ctx.beginPath();
    ctx.arc(star.x,star.y,star.r,0,Math.PI*2);
    ctx.fill();
    if(Math.hypot(ball.x-star.x,ball.y-star.y)<ball.r+star.r){
      star.active=false;
      score+=5;
      beep(660,0.05);
      scoreEl.textContent=score;
      if(score>highscore){
        highscore=score;
        highEl.textContent=highscore;
        localStorage.setItem('bbHighScore',highscore);
        updateThemes();
      }
    }
  }
  ball.draw();
  updateParticles();
  drawParticles();
  requestAnimationFrame(loop);
}

window.onresize=()=>{w=window.innerWidth;h=window.innerHeight;canvas.width=w;canvas.height=h;if(gameRunning)platform.y=h*0.8;};

document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft' || e.key==='a')ball.x-=40;if(e.key==='ArrowRight'||e.key==='d')ball.x+=40;});
canvas.addEventListener('touchstart',e=>{let x=e.touches[0].clientX;if(x<w/2)ball.x-=40;else ball.x+=40;});

themeSelect.onchange=()=>{
  if(highscore>=skins[themeSelect.value].unlock){
    currentSkin=parseInt(themeSelect.value);
    if(ball) ball.color=skins[currentSkin].color;
  }
}

const startBtn=document.getElementById('startBtn');
const retryBtn=document.getElementById('retryBtn');
startBtn.onclick=()=>{startBtn.style.display='none';start();};
retryBtn.onclick=()=>{retryBtn.style.display='none';start();};
