# FAST TEMPLATE, 3D PHONE LOOK (example: "pull to refresh", 1080x1920, 22.4 s). Copy it, then replace BODY, the screen layers, SCHED, CUTS and the render() details.
# Usage: python3 phone_make.py sheet 0,1.5,3,...  -> still frames;  python3 phone_make.py  -> out/silent.mp4
import asyncio, os, sys, subprocess, shutil, json
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "assets", "fonts")
LOGO = open(os.path.join(HERE, "..", "assets", "zip.svg.txt"), encoding="utf-8").read()
FPS, DUR = 30, 22.4
MODE = sys.argv[1] if len(sys.argv) > 1 else "full"
SHEET_T = [float(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else []

ff = ""
for fam, pkg, ws in [("League Spartan", "league-spartan", [700]), ("Work Sans", "work-sans", [400, 500, 600])]:
    for w in ws:
        p = os.path.abspath(os.path.join(FONTS, pkg, "files", "%s-latin-%d-normal.woff2" % (pkg, w)))
        ff += "@font-face{font-family:'%s';font-weight:%d;src:url('file://%s') format('woff2')}" % (fam, w, p)

CUTS = [2.2, 4.4, 6.6, 8.8, 11.0, 13.2, 15.6, 18.6, 20.4]

def post(n, cls=""):
    return ''.join('<div class="post %s"><i></i><div><b></b><s></s><s class="sh"></s></div></div>' % cls for _ in range(n))

BODY = r"""
<div id="shapes"></div>
<div id="cam">
<!-- headlines (one at a time, upper centre) -->
<div class="e hd" data-t="0 2.2" data-fx="none">One person<br>invented <em>this.</em></div>
<div class="e hd" data-t="2.2 4.4" data-fx="none"><span class="w" data-w="2.25">Pull.</span> <span class="w" data-w="2.75">Release.</span><br><span class="w" data-w="3.3"><em>New posts.</em></span></div>
<div class="e hd" data-t="4.4 6.6" data-fx="none"><span class="w" data-w="4.45">His name:</span><br><span class="w" data-w="4.85"><em>Loren Brichter.</em></span></div>
<div class="e hd" data-t="6.6 8.8" data-fx="none"><span class="w" data-w="6.65">Twitter</span> <span class="w" data-w="6.9">bought</span><br><span class="w" data-w="7.15">his</span> <span class="w" data-w="7.35"><em>app.</em></span></div>
<div class="e hd" data-t="8.8 11.0" data-fx="none"><span class="w" data-w="8.85">Then the</span> <span class="w" data-w="9.15"><em>patent</em></span><br><span class="w" data-w="9.45">came through.</span></div>
<div class="e hd" data-t="11.0 13.2" data-fx="none"><span class="w" data-w="11.05">Now you pull it</span><br><span class="w" data-w="11.35"><em>every day.</em></span></div>
<div class="e hd" data-t="13.2 15.6" data-fx="none"><span class="w" data-w="13.25">Critics compare it</span><br><span class="w" data-w="13.65">to a <em>slot machine.</em></span></div>
<div class="e hd" data-t="15.6 18.6" data-fx="none"><span class="w" data-w="15.65">Even its inventor</span><br><span class="w" data-w="15.95">said it's <em>addictive.</em></span></div>
<div class="e hd" data-t="18.6 20.4" data-fx="none"><span class="w" data-w="18.65">You'll notice</span><br><span class="w" data-w="18.95"><em>every pull</em></span> <span class="w" data-w="19.25">now.</span></div>

<!-- phone (3D) -->
<div id="stage"><div class="e" id="phone" data-t="0 20.4" data-fx="none"><div id="scr">
 <!-- feed -->
 <div class="lay" id="L_feed"><div class="bar">Feed</div>
  <div id="spin"><svg width="54" height="54" viewBox="0 0 54 54"><circle cx="27" cy="27" r="20" fill="none" stroke="#C7CBD4" stroke-width="6"/><path id="arc" d="M27 7 A20 20 0 0 1 47 27" fill="none" stroke="#FF5A1F" stroke-width="6" stroke-linecap="round"/></svg></div>
  <div id="feed"><div id="newp">POSTS_NEW</div>POSTS</div></div>
 <!-- app card -->
 <div class="lay" id="L_app" style="background:#F4F5F7"><div class="appicon">T</div><div class="appn">Tweetie</div><div class="apps">for iPhone</div>
  <div class="pill">Bought by Twitter · 2010</div></div>
 <!-- patent -->
 <div class="lay" id="L_pat" style="background:#FBFAF6;padding:70px 40px"><div class="pt1">United States Patent</div><div class="pt2">US 8,448,084 B2</div>
  <div class="pt3">User interface mechanics</div><div class="pt4">Inventor: Loren Brichter<br>Assignee: Twitter, Inc.</div>
  <div class="pt5" id="stamp">GRANTED<br>MAY 21, 2013</div></div>
 <!-- other apps -->
 <div class="lay" id="L_mail"><div class="bar">Inbox</div>MAIL</div>
 <div class="lay" id="L_news"><div class="bar">News</div>NEWS</div>
 <div class="lay" id="L_shop"><div class="bar">Orders</div>SHOP</div>
 <!-- slot -->
 <div class="lay" id="L_slot" style="background:#111"><div class="reels"><div class="reel"><div class="strip" id="r0"></div></div><div class="reel"><div class="strip" id="r1"></div></div><div class="reel"><div class="strip" id="r2"></div></div></div>
  <div class="lever" id="lever"><i></i></div></div>
 <!-- quote -->
 <div class="lay" id="L_quote" style="background:#0D0D0F;color:#FAFAFA;padding:90px 44px"><div class="q">“<span class="w" data-w="16.2">Pull-to-refresh</span> <span class="w" data-w="16.6">is</span> <span class="w" data-w="16.8" style="color:#FF5A1F">addictive.</span>”</div>
  <div class="qs">Loren Brichter<br>The Guardian, 2017</div></div>
 <div id="finger"></div>
</div></div></div>

<!-- floating chips -->
<div class="e chip" data-t="4.7 6.6" data-fx="flyL" style="left:40px;top:760px">✎ Designer</div>
<div class="e chip" data-t="5.0 6.6" data-fx="flyR" style="left:700px;top:1020px">iPhone app</div>
<div class="e chip" data-t="5.3 6.6" data-fx="flyL" style="left:60px;top:1300px">Pull-to-refresh</div>
<div class="e chip" data-t="7.6 8.8" data-fx="flyR" style="left:690px;top:800px">Acquired · 2010</div>
<div class="e chip" data-t="9.7 11.0" data-fx="flyL" style="left:30px;top:900px">Filed · Apr 8, 2010</div>
<div class="e chip" data-t="10.0 11.0" data-fx="flyR" style="left:700px;top:1250px">Granted · 2013</div>
<div class="e chip" data-t="11.4 13.2" data-fx="flyL" style="left:40px;top:820px">Email</div>
<div class="e chip" data-t="11.8 13.2" data-fx="flyR" style="left:760px;top:1000px">News</div>
<div class="e chip" data-t="12.2 13.2" data-fx="flyL" style="left:60px;top:1240px">Shopping</div>

<div class="e note" data-t="2.2 15.6" data-fx="none">Illustration. App screens are made up.</div>
</div>

<!-- end card -->
<div class="e" data-t="20.4 22.5" data-fx="up" style="left:0;right:0;top:700px;text-align:center">LOGO
 <div style="font-size:44px;color:#A1A1A9;margin-top:34px">Systems that sell.</div></div>
<div class="grid"></div>
"""

MAILS = ''.join('<div class="row"><span class="env">✉</span><div><b></b><s></s></div></div>' for _ in range(7))
NEWS = ''.join('<div class="row"><span class="img"></span><div><b></b><s></s></div></div>' for _ in range(6))
SHOP = ''.join('<div class="row"><span class="box">▣</span><div><b></b><s></s></div></div>' for _ in range(6))

html = r"""<!doctype html><html><head><meta charset="utf-8"><style>@@FF@@
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;background:#000;overflow:hidden}
#v{position:relative;width:1080px;height:1920px;background:#000;font-family:'Work Sans';color:#FAFAFA;overflow:hidden;--c1:#fff;--c2:#d6d6dc;--c3:#5c5c64;--c4:#19191d;--c5:#f5f5f7;--c6:#8e8e96}
.grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(#ffffff0b 1px,transparent 1px),linear-gradient(90deg,#ffffff0b 1px,transparent 1px);background-size:90px 90px}
#cam{position:absolute;inset:0;transform-origin:50% 55%}
.e{position:absolute;opacity:0;will-change:transform,opacity,filter}
.hd{left:60px;right:60px;top:300px;text-align:center;font-family:'League Spartan';font-weight:700;text-transform:uppercase;font-size:96px;line-height:1;letter-spacing:-.01em}
.hd em{font-style:normal;color:#FF5A1F}
.w{display:inline-block;opacity:0}
.note{left:0;right:0;top:1700px;text-align:center;font-size:26px;color:#6B6B73}
#shapes{position:absolute;inset:0}
.shp{position:absolute;border-radius:999px;background:linear-gradient(140deg,#3a3a40,#121214 70%);box-shadow:inset 6px 8px 14px #ffffff22,0 30px 60px #000a}
#stage{position:absolute;left:0;right:0;top:560px;height:1100px;perspective:2200px}
#phone{left:290px;top:0;width:500px;height:1040px;border-radius:84px;background:linear-gradient(145deg,#2c2c31,#0b0b0d);padding:18px;box-shadow:0 60px 120px #000c, inset 0 0 0 3px #3a3a40;transform-style:preserve-3d}
#scr{position:relative;width:100%;height:100%;border-radius:68px;overflow:hidden;background:#fff;color:#111}
#scr:before{content:"";position:absolute;left:50%;top:18px;width:140px;height:40px;margin-left:-70px;border-radius:20px;background:#000;z-index:9}
.lay{position:absolute;inset:0;opacity:0;background:#fff;padding-top:80px}
.bar{font-weight:700;font-size:44px;padding:16px 34px 18px;color:#111}
#spin{position:absolute;left:50%;top:150px;margin-left:-27px;opacity:0}
#feed{position:relative;padding:0 22px}
.post{display:flex;gap:18px;padding:22px 16px;border-bottom:2px solid #EEF0F3}
.post i{width:70px;height:70px;border-radius:50%;background:#D9DDE4;flex:none}
.post b{display:block;height:20px;width:180px;border-radius:10px;background:#B9BEC8}
.post s{display:block;height:16px;width:300px;border-radius:8px;background:#E2E5EA;margin-top:14px}
.post s.sh{width:220px}
.post.nw{background:#FFF1EA}.post.nw i{background:#FF5A1F}
#newp{overflow:hidden;height:0}
.appicon{width:220px;height:220px;border-radius:52px;margin:110px auto 0;background:linear-gradient(160deg,#5AB3FF,#1E6FD9);color:#fff;font-family:'League Spartan';font-weight:700;font-size:150px;display:flex;align-items:center;justify-content:center}
.appn{text-align:center;font-weight:700;font-size:56px;margin-top:40px}.apps{text-align:center;font-size:30px;color:#6B7280}
.pill{margin:60px auto 0;width:max-content;background:#111;color:#fff;font-weight:600;font-size:28px;padding:16px 26px;border-radius:999px}
.pt1{font-family:'Bitstream Charter',serif;font-size:30px;color:#444}.pt2{font-family:'League Spartan';font-weight:700;font-size:58px;margin-top:20px}
.pt3{font-family:'Bitstream Charter',serif;font-style:italic;font-size:44px;margin-top:40px}.pt4{font-size:26px;color:#555;margin-top:40px;line-height:1.5}
.pt5{margin:70px auto 0;width:300px;text-align:center;border:6px solid #C0262D;color:#C0262D;font-family:'League Spartan';font-weight:700;font-size:40px;line-height:1.1;padding:18px 10px;border-radius:14px;transform:rotate(-8deg)}
.row{display:flex;gap:18px;align-items:center;padding:22px 34px;border-bottom:2px solid #EEF0F3}
.row b{display:block;height:20px;width:220px;border-radius:10px;background:#B9BEC8}.row s{display:block;height:16px;width:280px;border-radius:8px;background:#E2E5EA;margin-top:12px}
.env,.box{font-size:44px;color:#9AA1AD;width:60px;text-align:center}.img{width:90px;height:70px;border-radius:12px;background:#D9DDE4;flex:none}
.reels{display:flex;gap:14px;justify-content:center;margin-top:260px}
.reel{width:120px;height:170px;overflow:hidden;border-radius:18px;background:#FAFAFA;position:relative}
.strip{position:absolute;left:0;right:0;top:0}
.sym{height:170px;display:flex;align-items:center;justify-content:center;font-family:'League Spartan';font-weight:700;font-size:96px;color:#111}
.lever{position:absolute;right:26px;top:250px;width:14px;height:200px;background:#555;border-radius:7px;transform-origin:50% 100%}
.lever i{position:absolute;left:-16px;top:-30px;width:46px;height:46px;border-radius:50%;background:#FF5A1F}
.q{font-family:"Bitstream Charter",serif;font-style:italic;font-size:78px;line-height:1.15}.qs{font-size:28px;color:#A1A1A9;margin-top:50px;line-height:1.4}
#finger{position:absolute;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;background:#11111122;border:4px solid #FF5A1F;opacity:0;z-index:20}
.chip{background:#FAFAFA;color:#000;font-weight:600;font-size:34px;padding:22px 30px;border-radius:22px;box-shadow:0 20px 50px #000b;white-space:nowrap}
svg.zip{width:380px;height:auto;display:block;margin:0 auto}
</style></head><body><div id="v">@@BODY@@</div>
<script>
const CUTS=@@CUTS@@;
const els=[...document.querySelectorAll('.e[data-t]')];
const words=[...document.querySelectorAll('.w')];
const cl=x=>Math.min(Math.max(x,0),1), ease=x=>1-Math.pow(1-cl(x),3), lerp=(a,b,x)=>a+(b-a)*x;
const back=x=>{x=cl(x);const c=2.2;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const $=id=>document.getElementById(id);
// background shapes
const SH=[[80,180,90,260,0],[900,620,100,280,1.3],[120,1500,70,200,2.1],[900,1580,130,320,0.7],[40,980,60,160,3.0],[960,1180,70,180,1.8]];
$('shapes').innerHTML=SH.map((s,i)=>'<div class="shp" id="sh'+i+'" style="left:'+s[0]+'px;top:'+s[1]+'px;width:'+s[2]+'px;height:'+s[3]+'px"></div>').join('');
const SYM=['7','★','$','7','♦','★','7','$','♦','7'];
['r0','r1','r2'].forEach(r=>$(r).innerHTML=SYM.concat(SYM).map(s=>'<div class="sym">'+s+'</div>').join(''));
// layer schedule [id, from, to]
const SCHED=[['L_feed',0,6.6],['L_app',6.6,8.8],['L_pat',8.8,11.0],['L_mail',11.0,11.6],['L_news',11.6,12.2],['L_shop',12.2,12.8],['L_feed',12.8,13.2],['L_slot',13.2,15.6],['L_quote',15.6,20.4]];
window.render=function(t){
 // camera
 let last=0;for(const c of CUTS)if(t>=c)last=c;const since=t-last;
 let s=1+0.025*since; if(last>0)s+=0.06*(1-ease(since/0.3));
 let wx=0,bl=0;for(const c of CUTS){const d=t-c;if(d>-0.1&&d<0.14){const k=d<0?(d+0.1)/0.1:1-d/0.14;wx+=(d<0?-1:1)*-120*k;bl=Math.max(bl,12*k)}}
 $('cam').style.transform='translateX('+wx+'px) scale('+s+')';$('cam').style.filter=bl>0.5?'blur('+bl+'px)':'none';
 for(const e of els){const [a,b]=e.dataset.t.split(' ').map(Number);const fx=e.dataset.fx;let o=0,tr='',f='';
  if(t>=a&&t<b){const p=t-a,out=cl((b-t)/0.1);
   if(fx==='none')o=out;
   else if(fx==='flyL'||fx==='flyR'){const k=ease(p/0.35),dir=fx==='flyL'?-1:1;o=Math.min(cl(p/0.15),out);tr='translate('+(dir*(1-k)*500)+'px,'+(Math.sin((t+a)*2.2)*10)+'px) rotate('+(dir*(1-k)*-14+Math.sin(t*1.7+a)*2)+'deg)'}
   else if(fx==='up'){const k=ease(p/0.35);o=Math.min(k,out);tr='translateY('+((1-k)*60)+'px)'}}
  e.style.opacity=o;e.style.transform=tr;e.style.filter=f||'none';}
 for(const w of words){const a=parseFloat(w.dataset.w),k=cl((t-a)/0.12),m=ease((t-a)/0.2);w.style.opacity=k;w.style.transform='translateY('+((1-m)*40)+'px) scale('+lerp(1.3,1,m)+')';w.style.filter='blur('+((1-k)*8)+'px)'}
 // shapes drift
 SH.forEach((q,i)=>{$('sh'+i).style.transform='translate('+Math.sin(t*0.7+q[4])*24+'px,'+Math.cos(t*0.6+q[4])*30+'px) rotate('+(25+Math.sin(t*0.5+q[4])*20)+'deg)'});
 // phone 3D: flies in rotating, then wobbles; spins on scene cuts
 const enter=ease(t/1.0);let ry=lerp(-40,0,enter)+Math.sin(t*1.3)*7, rx=6+Math.sin(t*0.9)*3, ty=lerp(300,0,enter), sc=lerp(.7,1,enter);
 for(const c of [6.6,8.8,13.2,15.6]){const d=t-c;if(d>-0.15&&d<0.45){ry+=(d<0?d/0.15*-25:(1-ease(d/0.45))*-25+ (d<0.0?0:0))+ (d>=0?360*0:0)}}
 const sp=t>=11.0&&t<11.4?ease((t-11.0)/0.4)*360:0;
 const out=t>20.0?ease((t-20.0)/0.4):0;
 $('phone').style.transform='translateY('+(ty+out*900)+'px) scale('+sc+') rotateY('+(ry+sp)+'deg) rotateX('+rx+'deg)';
 // screen layers
 for(const id of ['L_feed','L_app','L_pat','L_mail','L_news','L_shop','L_slot','L_quote'])$(id).style.opacity=0;
 for(const [id,a,b] of SCHED)if(t>=a&&t<b)$(id).style.opacity=1;
 // feed pull (scene 1 tease at 1.2-2.0, full pull 2.3-3.6, quick pull in 12.8)
 let pull=0;const P=(a,d,h)=>{const x=t-a;if(x<0||x>d)return 0;return x<d*0.45?ease(x/(d*0.45))*h:(1-ease((x-d*0.45)/(d*0.55)))*h};
 pull=Math.max(P(1.2,0.9,90),P(2.3,1.3,190),P(12.8,0.4,150));
 $('feed').style.transform='translateY('+pull+'px)';
 $('spin').style.opacity=cl(pull/80);$('spin').style.transform='rotate('+(t*540)+'deg)';
 const nh=lerp(0,2*114,ease((t-3.25)/0.4));$('newp').style.height=nh+'px';
 // finger on the pull
 const fg=$('finger');let fo=0,fx=250,fy=330;
 if(t>=1.1&&t<2.15){fo=1;fy=330+P(1.2,0.9,90)} if(t>=2.25&&t<3.65){fo=1;fy=330+P(2.3,1.3,190)} if(t>=12.75&&t<13.2){fo=1;fy=330+P(12.8,0.4,150)}
 fg.style.opacity=fo;fg.style.left=fx+'px';fg.style.top=fy+'px';
 // patent stamp
 const st=ease((t-9.6)/0.25);$('stamp').style.opacity=st;$('stamp').style.transform='rotate(-8deg) scale('+lerp(2.2,1,st)+')';
 // slot reels spin and stop on 7 7 7
 [0,1,2].forEach(i=>{const a=13.5,stop=14.5+i*0.3;let y=0;
  if(t>=a&&t<stop)y=((t-a)*14*170)%1700;
  else if(t>=stop){const k=(t-stop);y=-Math.sin(Math.min(k/0.25,1)*Math.PI)*30*(k<0.25?1:0)}
  $('r'+i).style.transform='translateY('+(-y)+'px)';});
 $('lever').style.transform='rotate('+(t>13.3&&t<13.8?Math.sin((t-13.3)/0.5*Math.PI)*35:0)+'deg)';
};
render(0);
</script></body></html>"""
html = (html.replace("@@FF@@", ff).replace("@@BODY@@", BODY.replace("LOGO", LOGO).replace("POSTS_NEW", post(2, "nw")).replace("POSTS", post(7))
        .replace("MAIL", MAILS).replace("NEWS", NEWS).replace("SHOP", SHOP)).replace("@@CUTS@@", json.dumps(CUTS)))

hp = os.path.join(HERE, "_v.html"); open(hp, "w", encoding="utf-8").write(html)
FR = os.path.join(HERE, "frames"); OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)


async def open_page(p):
    b = await p.chromium.launch(**({"executable_path": "/opt/pw-browsers/chromium"} if os.path.exists("/opt/pw-browsers/chromium") else {}))
    pg = await b.new_page(viewport={"width": 1080, "height": 1920})
    await pg.goto("file://" + hp); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(800)
    return b, pg


async def worker(p, k, nw, n):
    b, pg = await open_page(p)
    for i in range(k, n, nw):
        await pg.evaluate("render(%f)" % (i / FPS))
        await pg.screenshot(path=os.path.join(FR, "f%04d.jpg" % i), type="jpeg", quality=92)
    await b.close()


async def main():
    async with async_playwright() as p:
        if MODE == "sheet":
            b, pg = await open_page(p)
            for t in SHEET_T:
                await pg.evaluate("render(%f)" % t)
                await pg.screenshot(path=os.path.join(HERE, "sh_%05.2f.jpg" % t), type="jpeg", quality=80)
            await b.close()
        else:
            shutil.rmtree(FR, ignore_errors=True); os.makedirs(FR)
            n = int(FPS * DUR); await asyncio.gather(*[worker(p, k, 6, n) for k in range(6)])

asyncio.run(main())
if MODE != "sheet":
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(FR, "f%04d.jpg"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-movflags", "+faststart", os.path.join(OUT, "silent.mp4")], check=True)
    print("done")
