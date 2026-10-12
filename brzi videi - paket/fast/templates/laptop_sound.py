# Synthesised music + sound effects (no licence issues). Edit BPM, cut times and effect times to match the video.
import numpy as np, wave
SR=48000; DUR=22.0; N=int(SR*DUR); rng=np.random.default_rng(11); mix=np.zeros((N,2))
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
BPM=125; b=60/BPM
kn=int(.3*SR);kt=np.arange(kn)/SR;kick=np.sin(2*np.pi*(45+110*np.exp(-kt*35))*kt)*np.exp(-kt*10)
hn=int(.04*SR);hat=rng.standard_normal(hn);hat=(hat-lp(hat,7000))*np.exp(-np.arange(hn)/(.008*SR))
cn=int(.18*SR);clap=rng.standard_normal(cn);clap=(lp(clap,4000)-lp(clap,900))*env(cn,.001,.05)
roots=[55.0,55.0,43.65,49.0]  # A A F G
END=20.0
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
CUTS=[1.9,3.4,5.8,7.2,8.6,10.6,12.0,15.0,16.8,18.0,20.0]
for c in CUTS:
    add(whoosh()*.22,c-.2); add(stab([220,277.2,329.6])*.05,c)
# riser into the name reveal
n=int(1.2*SR);tt=np.arange(n)/SR;x=rng.standard_normal(n);x=x-lp(x,1500);add(x*np.linspace(0,1,n)**2*.12,6.0)
for p,f in [(0.5,880),(1.0,440),(1.9,660),(2.6,780),(3.5,700),(3.75,740),(4.0,780),(4.25,830),(4.9,990),(5.8,330),(6.4,520),(6.6,1200),
            (7.3,660),(7.55,780),(7.85,990),(10.65,700),(10.85,740),(11.05,780),(11.3,830),(11.5,990),(12.6,600),(13.9,1100),
            (15.0,700),(15.55,780),(16.15,990),(16.9,700),(18.2,660),(18.4,700),(18.6,740),(18.8,780),(19.0,990)]:
    add(pop(f)*.16,p,pan=.2 if f>800 else -.2)
for j in range(5): add(tick()*.3,8.75+j*.38); add(pop(1400)*.06,8.75+j*.38)
for j in range(24): add(tick()*.08,12.1+j*.035)
for j in range(26): add(tick()*.08,12.9+j*.035)
for j in range(20): add(tick()*.07,16.8+j*.035)
n=int(1.6*SR);tt=np.arange(n)/SR
add(sum(np.sin(2*np.pi*f*tt) for f in [523.25,659.25,783.99,1046.5])*env(n,.005,.5)*.07,20.05)
fade=np.ones(N);s0=int(21.2*SR);fade[s0:]=np.linspace(1,.0,N-s0)**.5
mix*=fade[:,None]
mix/=np.max(np.abs(mix))*1.12
import os
with wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"sound.wav"),"wb") as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype(np.int16).tobytes())
print("ok")
