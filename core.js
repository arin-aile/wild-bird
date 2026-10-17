(function(root){
function subjectParticle(word){const c=word.trim().at(-1)?.charCodeAt(0);return c>=0xac00&&c<=0xd7a3?(c-0xac00)%28?'이':'가':null;}
function contain(iw,ih,x,y,w,h){const s=Math.min(w/iw,h/ih);return {x:x+(w-iw*s)/2,y:y+(h-ih*s)/2,w:iw*s,h:ih*s,scale:s};}
function point(u,v,p){const e=p*p*(3-2*p),a=e*Math.PI;const s=10+u*574,bow=Math.sin(Math.PI*p)*Math.sin(Math.PI*Math.max(0,(u-34/574)/(1-34/574)))*35;const x=s*Math.cos(a)-bow*Math.sin(a),z=s*Math.sin(a)+bow*Math.cos(a);const k=2400/(2400-z);return {x:960+x*k,y:557+(220+675*v-557)*k,z};}
const api={subjectParticle,contain,point};if(typeof module!=='undefined')module.exports=api;root.BookCore=api;
})(typeof window!=='undefined'?window:globalThis);
