# Synthesised music + sound effects for the phone template. Edit BPM, CUTS, word-pop times and effect times to match the video.
import numpy as np, wave
SR=48000; DUR=22.4; N=int(SR*DUR); rng=np.random.default_rng(11); mix=np.zeros((N,2))
def add(sig,start,gain=1.0,pan=0.0):
    i=int(start*SR); j=min(N,i+len(sig))
    if i>=N or j<=i: return
    l=np.cos((pan+1)*np.pi/4); r=np.sin((pan+1)*np.pi/4)
    mix[i:j,0]+=sig[:j-i]*gain*l*1.414; mix[i:j,1]+=sig[:j-i]*gain*r*1.414
def env(n,a,d):
    e=np.ones(n);A=max(1,int(a*SR));e[:A]=np.linspace(0,1,A);e*=np.exp(-np.arange(n)/(d*SR));return e
def lp(x,c):
    a=np.exp(-2*np.pi*c/SR);y=np.zeros_like(x);s=0.0
    for k in range(len(x)): s=(1-a)*x[k]+a*s; y[k]=s
    return y
BPM=122; b=60/BPM
kn=int(.3*SR);kt=np.arange(kn)/SR;kick=np.sin(2*np.pi*(45+110*np.exp(-kt*35))*kt)*np.exp(-kt*10)
hn=int(.04*SR);hat=rng.standard_normal(hn);hat=(hat-lp(hat,7000))*np.exp(-np.arange(hn)/(.008*SR))
cn=int(.18*SR);clap=rng.standard_normal(cn);clap=(lp(clap,4000)-lp(clap,900))*env(cn,.001,.05)
roots=[49.0,49.0,58.27,43.65]  # A A F G
END=20.4
k=0.0;i=0
while k<END-0.01:
    add(kick*.42,k)
    if i%2==1: add(clap*.5,k)
    add(hat*.06,k+b/2,pan=.3); add(hat*.03,k+b/4,pan=-.3); add(hat*.03,k+3*b/4,pan=-.3)
    f=roots[(i//8)%4]; n=int(b/2*SR); tt=np.arange(n)/SR
    for h in (0,1):
        bs=np.sign(np.sin(2*np.pi*f*tt))*0.5+np.sin(2*np.pi*f*tt); bs=lp(bs,600)*env(n,.005,.12)
        add(bs*.22,k+h*b/2)
    k+=b;i+=1
# stab chords on each cut
def stab(fs,l=.35):
    n=int(l*SR);tt=np.arange(n)/SR;return sum(np.sin(2*np.pi*f*tt)+.4*np.sin(2*np.pi*2*f*tt) for f in fs)*env(n,.003,.12)
def whoosh(l=.35):
    n=int(l*SR);x=rng.standard_normal(n);x=lp(x,3500)-lp(x,400);return x*np.sin(np.linspace(0,np.pi,n))**2
def pop(f):
    n=int(.09*SR);tt=np.arange(n)/SR;return np.sin(2*np.pi*f*(1+.5*np.exp(-tt*50))*tt)*env(n,.001,.025)
def tick():
    n=int(.025*SR);return rng.standard_normal(n)*np.exp(-np.arange(n)/(.003*SR))
CUTS=[2.2,4.4,6.6,8.8,11.0,13.2,15.6,18.6,20.4]
for c in CUTS:
    add(whoosh()*.22,c-.2); add(stab([196,246.9,293.7])*.05,c)
n=int(1.0*SR);x=rng.standard_normal(n);x=x-lp(x,1500);add(x*np.linspace(0,1,n)**2*.12,12.2)
W=[2.25,2.75,3.3,4.45,4.85,6.65,6.9,7.15,7.35,8.85,9.15,9.45,11.05,11.35,13.25,13.65,15.65,15.95,16.2,16.6,16.8,18.65,18.95,19.25]
for i,p in enumerate(W): add(pop(620+(i%5)*90)*.15,p,pan=.2 if i%2 else -.2)
for p in [4.7,5.0,5.3,7.6,9.7,10.0,11.4,11.8,12.2]: add(whoosh(.25)*.14,p-.05,pan=-.4 if p in (4.7,5.3,9.7,11.4,12.2) else .4)
for a,d in [(1.2,.4),(2.3,.6),(12.8,.2)]: add(whoosh(d)*.18,a)
add(pop(1320)*.2,3.25); add(pop(1560)*.15,3.4)
th=int(.25*SR);tt=np.arange(th)/SR;add(np.sin(2*np.pi*(60+80*np.exp(-tt*30))*tt)*np.exp(-tt*14)*.5,9.6)
for j in range(int((15.1-13.5)/0.05)): add(tick()*.12,13.5+j*.05)
for k in range(3): add(pop(880+k*120)*.2,14.5+k*.3)
add(stab([392,493.9,587.3],.6)*.08,15.15)
n=int(1.6*SR);tt=np.arange(n)/SR
add(sum(np.sin(2*np.pi*f*tt) for f in [523.25,659.25,783.99,1046.5])*env(n,.005,.5)*.07,20.45)
fade=np.ones(N);s0=int(21.6*SR);fade[s0:]=np.linspace(1,.0,N-s0)**.5
mix*=fade[:,None]
mix/=np.max(np.abs(mix))*1.12
import os
with wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"sound.wav"),"wb") as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype(np.int16).tobytes())
print("ok")
