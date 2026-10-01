import sys, glob, os
from PIL import Image, ImageDraw
d=sys.argv[1]; out=sys.argv[2]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 4
fs=sorted(glob.glob(d+"/f*.jpg"))
if len(sys.argv)>4: fs=[f for f in fs if int(os.path.basename(f)[1:5]) in set(map(int,sys.argv[4].split(',')))]
ims=[Image.open(f) for f in fs]
w,h=ims[0].size; w2,h2=w//2*1,h//2*1
w2,h2=int(w*0.6),int(h*0.6)
rows=(len(ims)+cols-1)//cols
s=Image.new("RGB",(cols*(w2+6),rows*(h2+6)),"white")
dr=ImageDraw.Draw(s)
for k,(f,im) in enumerate(zip(fs,ims)):
    x=(k%cols)*(w2+6); y=(k//cols)*(h2+6)
    s.paste(im.resize((w2,h2)),(x,y)); dr.rectangle([x,y,x+64,y+20],fill="black"); dr.text((x+4,y+4),os.path.basename(f)[1:5],fill="yellow")
s.save(out,quality=85)
