# FAST TEMPLATE (example: "left digit", 1920x1080 laptop format, 22 s).
# Usage: python3 make.py sheet 0,1.5,3 -> still frames at those seconds;  python3 make.py -> out/silent.mp4
import asyncio, os, sys, subprocess, shutil, json
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "assets", "fonts")
LOGO = open(os.path.join(HERE, "..", "assets", "zip.svg.txt"), encoding="utf-8").read()
FPS, DUR = 30, 22.0
MODE = sys.argv[1] if len(sys.argv) > 1 else "full"
SHEET_T = [float(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else None

ff = ""
for fam, pkg, ws in [("League Spartan", "league-spartan", [700]), ("Work Sans", "work-sans", [400, 500, 600])]:
    for w in ws:
        p = os.path.abspath(os.path.join(FONTS, pkg, "files", "%s-latin-%d-normal.woff2" % (pkg, w)))
        ff += "@font-face{font-family:'%s';font-weight:%d;src:url('file://%s') format('woff2')}" % (fam, w, p)

# scene cut times (camera punch + whip happen here)
CUTS = [1.9, 3.4, 5.8, 7.2, 8.6, 10.6, 12.0, 15.0, 16.8, 18.0, 20.0]

BODY = r"""
<div id="cam">
<!-- full-bleed colour panels (content, with the grid drawn on top) -->
<div class="e panel" data-t="1.9 3.4" data-fx="whipR" style="background:#FF5A1F"></div>
<div class="e panel" data-t="7.2 8.6" data-fx="whipR" style="background:#2F6BFF"></div>
<div class="e panel" data-t="15.0 16.8" data-fx="whipR" style="background:#FAFAFA"></div>

<!-- S1 hook: on screen on frame 0 -->
<div class="e c" data-t="0 1.9" data-fx="none" style="top:150px;font-size:44px;color:#A1A1A9;font-weight:500">Which one feels cheaper?</div>
<div class="e tagp" id="t300" data-t="0 1.9" data-fx="none" style="left:330px;top:300px">$3.00</div>
<div class="e tagp" id="t299" data-t="0 1.9" data-fx="none" style="left:1010px;top:300px">$2.99</div>

<!-- S2 orange -->
<div class="e c big" data-t="1.9 2.6" data-fx="pop" style="top:390px;color:#000">One cent.</div>
<div class="e c big" data-t="2.6 3.4" data-fx="pop" style="top:390px;color:#000">Big difference.</div>

<!-- S3 brain reads left to right -->
<div class="e c huge" id="p299" data-t="3.4 5.8" data-fx="none" style="top:170px"><span id="d2">$2</span><span id="drest">.99</span></div>
<div class="e" id="sweep" data-t="3.6 5.8" data-fx="none" style="left:520px;top:640px;height:10px;border-radius:5px;background:#FF5A1F;width:0"></div>
<div class="e c" data-t="3.4 5.8" data-fx="none" style="top:760px;font-size:62px;font-weight:600">
 <span class="w" data-w="3.5">Your brain</span> <span class="w" data-w="3.75">reads</span> <span class="w" data-w="4.0">left</span> <span class="w" data-w="4.25">to right</span></div>
<div class="e c" data-t="4.9 5.8" data-fx="pop" style="top:880px;font-size:50px;color:#FF5A1F;font-weight:600">and grabs the first digit.</div>

<!-- S4 giant 2 -->
<div class="e c" id="g2" data-t="5.8 7.2" data-fx="zoomIn" style="top:-60px;font-family:'League Spartan';font-weight:700;font-size:1100px;line-height:1">2</div>
<div class="e" id="g3" data-t="6.4 7.2" data-fx="slideL" style="left:1360px;top:300px;font-family:'League Spartan';font-weight:700;font-size:420px;line-height:1;color:#6B6B73">3</div>
<div class="e" id="g3x" data-t="6.6 7.2" data-fx="none" style="left:1330px;top:470px;height:22px;width:0;background:#FF5A1F;border-radius:11px;transform:rotate(-12deg)"></div>

<!-- S5 blue: name -->
<div class="e c" data-t="7.2 8.6" data-fx="none" style="top:330px;font-size:150px;line-height:1.05;color:#fff">
 <span class="w" data-w="7.3" style="font-family:'League Spartan';font-weight:700;text-transform:uppercase">The</span>
 <span class="w" data-w="7.55 " style="font-family:'Bitstream Charter',serif;font-style:italic">left-digit</span><br>
 <span class="w" data-w="7.85" style="font-family:'League Spartan';font-weight:700;text-transform:uppercase">effect.</span></div>

<!-- S6 slot list -->
<div class="e c" data-t="8.6 10.6" data-fx="pop" style="top:120px;font-size:60px;font-weight:600;color:#A1A1A9">It's everywhere.</div>
<div class="e" id="slotwin" data-t="8.6 10.6" data-fx="none" style="left:0;right:0;top:300px;height:600px;overflow:hidden">
 <div id="slot" style="position:absolute;left:0;right:0;top:0"></div></div>
<div class="e" data-t="8.7 10.6" data-fx="slideR" style="left:560px;top:545px;font-size:90px;color:#FF5A1F;font-weight:600">→</div>

<!-- S7 cars -->
<div class="e c big" data-t="10.6 12.0" data-fx="none" style="top:400px">
 <span class="w" data-w="10.65">It</span> <span class="w" data-w="10.85">even</span> <span class="w" data-w="11.05">works</span> <span class="w" data-w="11.3">on</span> <span class="w" data-w="11.5" style="color:#FF5A1F">cars.</span></div>

<!-- S8 odometers -->
<div class="e card" id="cA" data-t="12.0 15.0" data-fx="slideR" style="left:250px;top:260px">
 <div class="lab">Used car A</div><div class="odo" id="oA">79,800</div><div class="lab2">miles</div></div>
<div class="e card" id="cB" data-t="12.6 15.0" data-fx="slideL" style="left:1000px;top:260px">
 <div class="lab">Used car B</div><div class="odo" id="oB">79,950</div><div class="lab2">miles</div></div>
<div class="e drop" data-t="13.9 15.0" data-fx="pop" style="left:1040px;top:720px">↓ about $210 less</div>
<div class="e c" data-t="12.0 15.0" data-fx="none" style="top:110px;font-size:48px;font-weight:600;color:#A1A1A9">Same kind of car. Sold at auction.</div>

<!-- S9 white panel quick hits -->
<div class="e c big" data-t="15.0 15.55" data-fx="pop" style="top:400px;color:#000">Same car.</div>
<div class="e c big" data-t="15.55 16.15" data-fx="pop" style="top:400px;color:#000">100 more miles.</div>
<div class="e c big" data-t="16.15 16.8" data-fx="pop" style="top:400px;color:#FF5A1F">Lower price.</div>

<!-- S10 source -->
<div class="e c" id="n22" data-t="16.8 18.0" data-fx="none" style="top:260px;font-family:'League Spartan';font-weight:700;font-size:260px;line-height:1">22,000,000</div>
<div class="e c" data-t="16.9 18.0" data-fx="pop" style="top:560px;font-size:56px;font-weight:600">used-car sales studied</div>
<div class="e c" data-t="17.1 18.0" data-fx="up" style="top:670px;font-size:34px;color:#A1A1A9">Lacetera, Pope &amp; Sydnor · NBER working paper 17030</div>

<!-- S11 payoff -->
<div class="e c huge" data-t="18.0 20.0" data-fx="zoomOut" style="top:170px">$2.99</div>
<div class="e c" data-t="18.0 20.0" data-fx="none" style="top:760px;font-size:72px;font-weight:600">
 <span class="w" data-w="18.2">Now</span> <span class="w" data-w="18.4">you'll</span> <span class="w" data-w="18.6">see</span> <span class="w" data-w="18.8">it</span> <span class="w" data-w="19.0" style="color:#FF5A1F">everywhere.</span></div>
</div>

<!-- S12 end card (outside camera so it stays still) -->
<div class="e" data-t="20.0 22.1" data-fx="up" style="left:0;right:0;top:360px;text-align:center">LOGO
 <div style="font-size:40px;color:#A1A1A9;margin-top:30px">Systems that sell.</div></div>
<div class="grid"></div>
"""

html = r"""<!doctype html><html><head><meta charset="utf-8"><style>FF
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;background:#000;overflow:hidden}
#v{position:relative;width:1920px;height:1080px;background:#000;font-family:'Work Sans';color:#FAFAFA;overflow:hidden;--c1:#fff;--c2:#d6d6dc;--c3:#5c5c64;--c4:#19191d;--c5:#f5f5f7;--c6:#8e8e96}
.grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(#ffffff0c 1px,transparent 1px),linear-gradient(90deg,#ffffff0c 1px,transparent 1px);background-size:90px 90px;mix-blend-mode:screen}
#cam{position:absolute;inset:0;transform-origin:50% 50%}
.e{position:absolute;opacity:0;will-change:transform,opacity,filter}
.panel{inset:0}
.c{left:0;right:0;text-align:center}
.big{font-family:'League Spartan';font-weight:700;text-transform:uppercase;font-size:170px;line-height:1;letter-spacing:-.01em}
.huge{font-family:'League Spartan';font-weight:700;font-size:430px;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.tagp{width:580px;height:440px;border-radius:40px;background:#FAFAFA;color:#000;font-family:'League Spartan';font-weight:700;font-size:190px;display:flex;align-items:center;justify-content:center}
.tagp:before{content:"";position:absolute;left:46px;top:46px;width:36px;height:36px;border-radius:50%;background:#000}
.w{display:inline-block;opacity:0}
.card{width:670px;height:420px;border-radius:36px;background:#17171A;border:3px solid #2A2A2E;padding:46px 54px}
.lab{font-size:34px;color:#A1A1A9;font-weight:500}
.odo{font-family:'League Spartan';font-weight:700;font-size:170px;line-height:1.1;margin-top:30px;font-variant-numeric:tabular-nums;letter-spacing:.01em}
.lab2{font-size:34px;color:#A1A1A9}
.drop{background:#FF5A1F;color:#000;font-weight:600;font-size:54px;padding:22px 40px;border-radius:999px}
.sl{height:200px;display:flex;align-items:center;justify-content:center;font-family:'League Spartan';font-weight:700;font-size:170px;line-height:1}
svg.zip{width:360px;height:auto;display:block;margin:0 auto}
</style></head><body><div id="v">BODY</div>
<script>
const CUTS=CUTSJSON;
const els=[...document.querySelectorAll('.e[data-t]')];
const words=[...document.querySelectorAll('.w')];
const cl=x=>Math.min(Math.max(x,0),1);
const ease=x=>1-Math.pow(1-cl(x),3);
const back=x=>{x=cl(x);const c=2.2;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const lerp=(a,b,x)=>a+(b-a)*x;
const $=id=>document.getElementById(id);
const PRICES=['$4.99','$19.99','$99.99','$1,999','$49,999','$4.99'];
$('slot').innerHTML=PRICES.map(p=>'<div class="sl">'+p+'</div>').join('');
const fmt=n=>Math.round(n).toLocaleString('en-US');
window.render=function(t){
 // camera: punch-in at each cut, slow push in between, whip offset around cuts
 let last=0;for(const c of CUTS)if(t>=c)last=c;
 const since=t-last;let s=1+0.035*since; if(last>0)s+=0.07*(1-ease(since/0.3));
 let wx=0,blur=0;for(const c of CUTS){const d=t-c;if(d>-0.1&&d<0.14){const k=d<0?(d+0.1)/0.1:1-d/0.14;wx+=(d<0?-1:1)*-160*k;blur=Math.max(blur,14*k)}}
 const cam=$('cam');cam.style.transform='translateX('+wx+'px) scale('+s+')';cam.style.filter=blur>0.5?'blur('+blur+'px)':'none';
 for(const e of els){const [a,b]=e.dataset.t.split(' ').map(Number);const fx=e.dataset.fx;let o=0,tr='',f='';
  if(t>=a&&t<b){const p=(t-a),out=cl((b-t)/0.08);
   if(fx==='none'){o=out}
   else if(fx==='pop'){const k=cl(p/0.16);o=Math.min(k,out);tr='scale('+lerp(.7,1,back(p/0.22))+')';f='blur('+((1-k)*10)+'px)'}
   else if(fx==='whipR'){o=1;tr='translateX('+((1-ease(p/0.18))*1920)+'px)'}
   else if(fx==='slideR'){const k=ease(p/0.25);o=Math.min(k,out);tr='translateX('+((1-k)*-260)+'px)'}
   else if(fx==='slideL'){const k=ease(p/0.25);o=Math.min(k,out);tr='translateX('+((1-k)*260)+'px)'}
   else if(fx==='up'){const k=ease(p/0.3);o=Math.min(k,out);tr='translateY('+((1-k)*50)+'px)'}
   else if(fx==='zoomIn'){const k=ease(p/0.3);o=Math.min(1,out);tr='scale('+lerp(.25,1,k)+')'}
   else if(fx==='zoomOut'){const k=ease(p/0.35);o=Math.min(k,out);tr='scale('+lerp(1.6,1,k)+')';f='blur('+((1-k)*12)+'px)'}}
  e.style.opacity=o;e.style.transform=tr;e.style.filter=f||'none';}
 for(const w of words){const a=parseFloat(w.dataset.w);const k=cl((t-a)/0.12);w.style.opacity=k;w.style.transform='translateY('+((1-ease((t-a)/0.18))*40)+'px) scale('+lerp(1.25,1,ease((t-a)/0.18))+')';w.style.filter='blur('+((1-k)*8)+'px)'}
 // hook: 2.99 bounces up, 3.00 sinks
 const h1=ease((t-0.5)/0.3),h2=ease((t-1.0)/0.3);
 $('t299').style.transform='scale('+(1+0.12*h1)+') rotate('+(-3*h1)+'deg)';
 $('t300').style.transform='scale('+(1-0.12*h2)+')';$('t300').style.opacity=t<1.9?1-0.6*h2:0;
 // sweep across $2.99, stops after the 2
 $('sweep').style.width=(lerp(0,330,ease((t-3.6)/0.6)))+'px';
 const dim=ease((t-4.4)/0.3);$('drest').style.opacity=1-0.75*dim;$('d2').style.color=dim>0.01?'#FF5A1F':'#FAFAFA';
 // giant 2 keeps pushing; 3 gets crossed
 $('g3x').style.width=lerp(0,320,ease((t-6.6)/0.2))+'px';
 // slot machine
 const step=Math.min(4,Math.max(0,(t-8.75)/0.38));const i=Math.floor(step),fr=step-i;const pos=i+ease(fr/0.45);
 $('slot').style.transform='translateY('+(200-pos*200)+'px)';
 [...$('slot').children].forEach((n,j)=>{const d=Math.abs(j-pos);n.style.opacity=Math.max(.15,1-d*.7);n.style.color=d<.5?'#FAFAFA':'#6B6B73'});
 // odometers
 $('oA').textContent=fmt(lerp(79800,79950,ease((t-12.1)/0.8)));
 $('oB').textContent=fmt(lerp(79950,80050,ease((t-12.9)/0.9)));
 const red=t>=13.75;$('oB').style.color=red?'#FF5A1F':'#FAFAFA';
 // counter
 $('n22').textContent=fmt(lerp(0,22000000,ease((t-16.8)/0.7)))+(t>17.5?'+':'');
};
render(0);
</script></body></html>"""
html = html.replace("FF", ff, 1).replace("BODY", BODY.replace("LOGO", LOGO)).replace("CUTSJSON", json.dumps(CUTS))

hp = os.path.join(HERE, "_v.html")
open(hp, "w", encoding="utf-8").write(html)
FR = os.path.join(HERE, "frames"); OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)


async def open_page(p):
    b = await p.chromium.launch(**({"executable_path": "/opt/pw-browsers/chromium"} if os.path.exists("/opt/pw-browsers/chromium") else {}))
    pg = await b.new_page(viewport={"width": 1920, "height": 1080})
    await pg.goto("file://" + hp)
    await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(800)
    return b, pg


async def worker(p, idx, nw, n):
    b, pg = await open_page(p)
    for i in range(idx, n, nw):
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
            n = int(FPS * DUR)
            await asyncio.gather(*[worker(p, k, 6, n) for k in range(6)])

asyncio.run(main())
if MODE != "sheet":
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(FR, "f%04d.jpg"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-movflags", "+faststart",
                    os.path.join(OUT, "silent.mp4")], check=True)
    print("done")
