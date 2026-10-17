/* Local portrait layout. No photos or landmarks are transmitted. */
(function(root){
const attached=new Set(['c3d8f.png','ebb0c.png','f8d12.png','b10d0.png']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
function fit(iw,ih,b){const scale=Math.min(b.w/iw,b.h/ih);return{x:b.x+(b.w-iw*scale)/2,y:b.y+(b.h-ih*scale)/2,w:iw*scale,h:ih*scale,scale};}
function arrange(stickers,info){const {photoWidth:iw,photoHeight:ih,photoBox,face,pose,mobile}=info,b=fit(iw,ih,photoBox),marks=pose?.landmarks||[];const landmark=i=>{const p=marks[i];return p&&(p.visibility??1)>.55&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1?{x:b.x+p.x*b.w,y:b.y+p.y*b.h}:null;};
 let head=null;
 if(face){const box=face.boundingBox;head={x:b.x+(box.originX+box.width/2)*b.scale,y:b.y+(box.originY+box.height/2)*b.scale,w:box.width*b.scale,h:box.height*b.scale};}
 else{const a=landmark(7),c=landmark(8),n=landmark(0);if(a&&c&&n){const w=distance(a,c)*1.3;head={x:n.x,y:n.y,w,h:w*1.25};}}
 if(!head)return;
 const eyes=face?(face.keypoints||[]).slice(0,2).map(p=>({x:b.x+p.x*b.w,y:b.y+p.y*b.h})).sort((a,c)=>a.x-c.x):[landmark(2),landmark(5)].filter(Boolean).sort((a,c)=>a.x-c.x);
 const angle=eyes.length===2?Math.atan2(eyes[1].y-eyes[0].y,eyes[1].x-eyes[0].x)*180/Math.PI:0;
 const shoulders=[landmark(11),landmark(12)],hasShoulders=shoulders.every(Boolean),shoulder=hasShoulders?midpoint(...shoulders):{x:head.x,y:head.y+head.h*.9};
 const sw=hasShoulders?distance(...shoulders):head.w*2.2;
 const mouths=[landmark(9),landmark(10)],mouth=mouths.every(Boolean)?midpoint(...mouths):{x:head.x,y:head.y+head.h*.25};
 const set=(s,x,y,w,a)=>{const ratio=s.h/s.w;s.x=x;s.y=y;s.w=w;s.h=w*ratio;s.angle=a;s.flip=1;};
 for(const s of stickers){if(s.asset==='c3d8f.png')set(s,head.x,head.y-head.h*.17,Math.max(head.w,head.h)*1.7,angle);
 else if(s.asset==='ebb0c.png')set(s,head.x,head.y-head.h*.68,head.w*1.85,angle);
 else if(s.asset==='f8d12.png'){const w=clamp(sw*.31,head.w*.55,head.w*1.05),h=w*s.h/s.w;const neck={x:shoulder.x,y:shoulder.y-head.h*.12};const hips=[landmark(23),landmark(24)],hip=hips.every(Boolean)?midpoint(...hips):{x:neck.x,y:neck.y+head.h*2};const a=Math.atan2(hip.y-neck.y,hip.x-neck.x)*180/Math.PI-90;set(s,neck.x-Math.sin(a*Math.PI/180)*h*.43,neck.y+Math.cos(a*Math.PI/180)*h*.43,w,a);}
 else if(s.asset==='b10d0.png'){const hands=[landmark(15),landmark(16)].filter(p=>p&&distance(p,mouth)<head.w*2.5).sort((a,c)=>distance(a,mouth)-distance(c,mouth));const hand=hands[0];if(hand){const r=s.h/s.w,base={x:.12,y:-.28*r},w=clamp(distance(hand,mouth)/Math.hypot(base.x,base.y),head.w*.45,head.w*.95);const a=Math.atan2(mouth.y-hand.y,mouth.x-hand.x)-Math.atan2(base.y,base.x),gx=-.17*w,gy=-.05*w*r;set(s,hand.x-gx*Math.cos(a)+gy*Math.sin(a),hand.y-gx*Math.sin(a)-gy*Math.cos(a),w,a*180/Math.PI);}else{const w=head.w*.64,h=w*s.h/s.w,a=-28*Math.PI/180;set(s,mouth.x+.05*w*Math.cos(a)-.33*h*Math.sin(a),mouth.y+.05*w*Math.sin(a)+.33*h*Math.cos(a),w,-28);}}}
 // Move decorative stickers off the detected person, preserving size and rotation.
 const mask=pose?.mask;
 function personAt(x,y){const nx=(x-b.x)/b.w,ny=(y-b.y)/b.h;if(nx<0||nx>1||ny<0||ny>1)return 0;if(mask){const ix=Math.min(mask.width-1,Math.floor(nx*mask.width)),iy=Math.min(mask.height-1,Math.floor(ny*mask.height));return mask.data[iy*mask.width+ix]>.35?1:0;}const faceHit=((x-head.x)/(head.w*.65))**2+((y-head.y)/(head.h*.8))**2<1;const torsoHit=Math.abs(x-shoulder.x)<sw*.55&&y>head.y+head.h*.3&&y<shoulder.y+head.h*2.5;return faceHit||torsoHit?1:0;}
 function overlap(s,x=s.x,y=s.y){let n=0;const a=s.angle*Math.PI/180;for(let iy=0;iy<9;iy++)for(let ix=0;ix<9;ix++){const dx=(ix/8-.5)*s.w,dy=(iy/8-.5)*s.h;n+=personAt(x+dx*Math.cos(a)-dy*Math.sin(a),y+dx*Math.sin(a)+dy*Math.cos(a));}return n/81;}
 const limits=mobile?{x:69,y:397,w:251,h:165}:{x:990,y:236,w:532,h:496};
 const decorations=stickers.filter(s=>!attached.has(s.asset)&&(mobile?s.y>390:s.x>960));
 for(const s of decorations){const initial=overlap(s);if(initial<.05)continue;const a=s.angle*Math.PI/180,hw=(Math.abs(Math.cos(a))*s.w+Math.abs(Math.sin(a))*s.h)/2,hh=(Math.abs(Math.sin(a))*s.w+Math.abs(Math.cos(a))*s.h)/2;let best={x:s.x,y:s.y,score:initial*1000};const original={x:s.x,y:s.y};
 for(let iy=0;iy<=14;iy++)for(let ix=0;ix<=16;ix++){const x=limits.x+hw+(limits.w-2*hw)*ix/16,y=limits.y+hh+(limits.h-2*hh)*iy/14;if(hw*2>limits.w||hh*2>limits.h)continue;const person=overlap(s,x,y),travel=distance({x,y},original)/limits.w;let crowded=0;for(const other of decorations){if(other===s)continue;const dx=Math.abs(x-other.x),dy=Math.abs(y-other.y);if(dx<(s.w+other.w)*.35&&dy<(s.h+other.h)*.35)crowded+=1;}const score=person*1000+travel*5+crowded*.8;if(score<best.score)best={x,y,score};}s.x=best.x;s.y=best.y;}
 return {head,bodyDetected:!!marks.length};
}
const api={arrange,fit};if(typeof module!=='undefined')module.exports=api;root.WBPlacement=api;
})(typeof window!=='undefined'?window:globalThis);
