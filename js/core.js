/* Constants, canvas setup, small helpers. Loaded first. */
const W=1120,H=700,DUR=660;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');cv.width=W;cv.height=H;
const $=id=>document.getElementById(id);
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(c1,c2,t)=>c1.map((v,i)=>Math.round(lerp(v,c2[i],t)));
const rgb=c=>'rgb('+c[0]+','+c[1]+','+c[2]+')';
const fmt=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};

