"""Create the English project brief and A3 poster from verified project assets."""
from pathlib import Path
from datetime import datetime, timezone
import json, math, sys
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, A3
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'submission/documents';DESIGN=ROOT/'submission/design'
OUT.mkdir(parents=True,exist_ok=True)
DATA=json.loads((DESIGN/'source/links.json').read_text())
BG=colors.HexColor('#070d17');PANEL=colors.HexColor('#101c2c');LINE=colors.HexColor('#30465e')
CYAN=colors.HexColor('#55eee8');PINK=colors.HexColor('#ff55c8');WHITE=colors.HexColor('#f0f6ff');MUTED=colors.HexColor('#aec1d4')
FONT='/System/Library/Fonts/Supplemental/'
for name,file in [('Body','Arial.ttf'),('Bold','Arial Bold.ttf'),('Heavy','Arial Black.ttf'),('Mono','Courier New.ttf'),('MonoBold','Courier New Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,FONT+file))
WIDTH,HEIGHT=A4;M=42;CONTENT=WIDTH-2*M

def paragraph(c,text,x,top,width,size=11,leading=None,color=MUTED,font='Body',maxheight=400):
    style=ParagraphStyle('p',fontName=font,fontSize=size,leading=leading or size*1.45,textColor=color,spaceAfter=0)
    p=Paragraph(text,style);w,h=p.wrap(width,maxheight)
    if h>maxheight+.1:raise ValueError('Paragraph overflow: '+text[:55])
    p.drawOn(c,x,HEIGHT-top-h);return top+h
def line(c,y):c.setStrokeColor(LINE);c.setLineWidth(.6);c.line(M,HEIGHT-y,WIDTH-M,HEIGHT-y)
def box(c,x,top,w,h,fill=PANEL,stroke=LINE,r=7):
    c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(.7);c.roundRect(x,HEIGHT-top-h,w,h,r,fill=1,stroke=1)
def label(c,text,x,top,color=CYAN,size=8):
    c.setFont('MonoBold',size);c.setFillColor(color);c.drawString(x,HEIGHT-top-size,text)
def text(c,value,x,top,size=12,font='Body',color=WHITE):
    c.setFillColor(color);c.setFont(font,size);c.drawString(x,HEIGHT-top-size,value)
def logo(c,x,top,size=27):
    image=DESIGN/'masters/logo.png'
    if image.exists():c.drawImage(str(image),x,HEIGHT-top-size,size,size,mask='auto')
    else:
        c.setFillColor(PINK);c.rect(x,HEIGHT-top-size,size,size,fill=1,stroke=0)
        p=c.beginPath();p.moveTo(x+size*.7,HEIGHT-top-size*.16);p.lineTo(x+size*.27,HEIGHT-top-size*.52);p.lineTo(x+size*.56,HEIGHT-top-size*.52);p.lineTo(x+size*.32,HEIGHT-top-size*.84);p.lineTo(x+size*.78,HEIGHT-top-size*.43);p.lineTo(x+size*.47,HEIGHT-top-size*.43);p.close();c.setFillColor(BG);c.drawPath(p,fill=1,stroke=0)
def base(c,page,title,eyebrow):
    c.setFillColor(BG);c.rect(0,0,WIDTH,HEIGHT,fill=1,stroke=0)
    c.setStrokeColor(colors.HexColor('#0c1725'));c.setLineWidth(.3)
    for x in range(0,int(WIDTH),32):c.line(x,0,x,HEIGHT)
    for y in range(0,int(HEIGHT),32):c.line(0,y,WIDTH,y)
    logo(c,M,31,25);text(c,'RULESHIFT',M+36,33,14,'MonoBold');text(c,'LIVE',M+128,33,14,'MonoBold',PINK)
    label(c,'PROJECT BRIEF / 2026',WIDTH-183,39,color=MUTED,size=7)
    line(c,74);label(c,eyebrow,M,95)
    text(c,title,M,118,28,'Heavy');line(c,HEIGHT-38)
    label(c,'CODEX x TWITCHCON / RULESHIFT LIVE',M,HEIGHT-29,color=MUTED,size=6.8)
    label(c,f'{page:02} / 04',WIDTH-M-42,HEIGHT-29,color=CYAN,size=7)
def section(c,title,top):label(c,title,M,top);return top+22
def screenshot(c,path,x,top,w,h,caption=None):
    box(c,x,top,w,h,fill=BG)
    c.drawImage(str(path),x+1,HEIGHT-top-h+1,w-2,h-2,preserveAspectRatio=True,anchor='c',mask='auto')
    if caption:paragraph(c,caption,x,top+h+7,w,size=8.2,leading=11,color=MUTED,maxheight=32)
def qr(c,url,x,top,size=74):
    c.setFillColor(colors.white);c.roundRect(x-5,HEIGHT-top-size-5,size+10,size+10,4,fill=1,stroke=0)
    code=QrCodeWidget(url,barLevel='M');x1,y1,x2,y2=code.getBounds();drawing=Drawing(size,size,transform=[size/(x2-x1),0,0,size/(y2-y1),-x1*size/(x2-x1),-y1*size/(y2-y1)]);drawing.add(code);renderPDF.draw(drawing,c,x,HEIGHT-top-size)
    c.linkURL(url,(x-5,HEIGHT-top-size-5,x+size+5,HEIGHT-top+5),relative=0,thickness=0)
def link(c,title,url,x,top,width=CONTENT):
    bottom=paragraph(c,f'<link href="{url}" color="#55eee8"><u>{title}</u></link>',x,top,width,size=10.2,color=CYAN,maxheight=42);return bottom

file=OUT/'ruleshift-live-project-brief.pdf';c=canvas.Canvas(str(file),pagesize=A4,pageCompression=1)
c.setTitle('RuleShift Live - Project Brief');c.setAuthor('RuleShift Live');c.setSubject('Codex x TwitchCon supporting project brief with verified implementation evidence');c.setCreator('ReportLab; original RuleShift design assets rendered with Remotion')
# 1: concept and demo
base(c,1,'Chat writes the rules.','01 / THE EXPERIENCE')
text(c,'You survive them.',M,153,30,'Heavy',PINK)
paragraph(c,'An interactive browser game for Twitch streamers. Viewers propose a supported rule; the streamer approves it; the arena changes its actual physics for a bounded time.',M,205,CONTENT,size=12,leading=17,maxheight=72)
hero=ROOT/'submission/video/demo/previews/encoded/gravity-reversed-final.png'
screenshot(c,hero,M,284,CONTENT,254,'Actual Twitch-source gameplay capture: the third coin has reversed gravity. The public broadcast excerpt is a separate recording.')
row=584;gap=10;w=(CONTENT-2*gap)/3
for i,(value,unit,note,color) in enumerate([('3','COINS','Triggers the demo rule',colors.HexColor('#ffdc78')),('4','SECONDS','Then gravity restores',CYAN),('75','SECOND ROUND','One active rule at a time',PINK)]):
    x=M+i*(w+gap);box(c,x,row,w,96);text(c,value,x+16,row+10,34,'Heavy',color);label(c,unit,x+16,row+53,color=WHITE,size=8);paragraph(c,note,x+16,row+70,w-27,size=8.2,leading=10,maxheight=22)
label(c,'WATCH THE 02:42 DEMO',M,711);link(c,'youtu.be/AvWHm6U2jUs',DATA['demo_video'],M,733,width=360)
paragraph(c,'English narration, subtitles, real application footage and Codex development footage.',M,755,340,size=8.6,leading=12,maxheight=31)
qr(c,DATA['demo_video'],WIDTH-M-72,706,72);c.showPage()
# 2: behavior and boundaries
base(c,2,'From chat to game physics.','02 / INTERACTION AND CONTROL')
y=181;gap=9;w=(CONTENT-3*gap)/4
for i,(heading,body) in enumerate([('CHAT','A real viewer sends a supported !rule proposal.'),('REVIEW','The streamer inspects the trigger and effect.'),('PLAY','One approved rule changes the active arena.'),('SAVE','The completed result is acknowledged in PostgreSQL.')]):
    x=M+i*(w+gap);box(c,x,y,w,128);label(c,f'0{i+1}',x+13,y+12,color=PINK);text(c,heading,x+13,y+35,13,'Bold');paragraph(c,body,x+13,y+59,w-24,size=9.1,leading=12,maxheight=60)
y=342;label(c,'THE DEMONSTRATED MESSAGE',M,y);box(c,M,y+23,CONTENT,57)
paragraph(c,'!rule Every third coin flips gravity for 4 seconds',M+14,y+40,CONTENT-28,size=9.2,font='Mono',color=CYAN,leading=14,maxheight=28)
y=449;label(c,'WHAT ACTUALLY CHANGES',M,y)
y=paragraph(c,'On each third coin, acceleration reverses and the player rises toward the solid ceiling. Four seconds later, normal gravity returns automatically. A repeat trigger refreshes the effect timer; it never stacks a permanent reversal.',M,y+24,CONTENT,size=11.3,leading=16,maxheight=100)
y=section(c,'STREAMER CONTROL AND INPUT LIMITS',y+30)
for title,body in [('Approval is explicit.','Chat cannot activate a rule by itself. One approved rule controls one active round.'),('The parser is constrained.','Supported triggers are 2-10 coins and durations are 1-6 whole seconds. Unsupported requests cannot be approved; chat is never executed as code.'),('Attribution stays attached.','The proposal, rule, originating message and author remain traceable. A downloadable controller record preserves bounded observed events.')]:
    y=paragraph(c,f'<b>{title}</b> {body}',M,y,CONTENT,size=10.5,leading=15,maxheight=72)+15
paragraph(c,'Milestone scope: one local streamer, one backend process and one arena. No runtime AI provider or paid inference is required.',M,752,CONTENT,size=9.2,leading=13,color=CYAN,maxheight=32);c.showPage()
# 3: implementation and Codex
base(c,3,'Built with Codex.','03 / IMPLEMENTATION AND VERIFICATION')
y=182
for title,body,color in [('BROWSER CONTROLLER','React + TypeScript + Canvas 2D: movement, collisions, gravity effects and observed events.',CYAN),('GO APPLICATION AND DOMAIN','Validated rules and round transitions. Application ports point inward; transport, Twitch and persistence are separate.',PINK),('INFRASTRUCTURE ADAPTERS','Twitch OAuth + EventSub WebSocket chat intake. PostgreSQL 18 repositories persist proposals and results.',CYAN)]:
    box(c,M,y,CONTENT,75);label(c,title,M+16,y+13,color=color,size=8.2);paragraph(c,body,M+16,y+33,CONTENT-32,size=10.1,leading=14,maxheight=32);y+=87
y=section(c,'HOW CODEX CONTRIBUTED',y+15)
y=paragraph(c,'Codex assisted with the Go boundaries, Twitch integration, TypeScript game engine, startup tooling and verification. Actual development footage shows source inspection and the verification commands running. Recorded checks cover race safety, persistence, HTTP behavior, constrained parsing, game behavior and the web build.',M,y,CONTENT,size=10.7,leading=15,maxheight=100)
screenshot(c,ROOT/'submission/video/demo/previews/encoded/codex.png',M,y+14,CONTENT,118,'Actual cropped Codex recording. It is development evidence, not a generated terminal interface.')
top=y+170;label(c,'RECORDED IMPLEMENTATION SESSION',M,top)
text(c,DATA['codex_session'],M,top+21,9.2,'Mono',WHITE)
paragraph(c,'Source: submission/codex-session.json. Confirm that this is the thread containing most of the project build before selecting the principal session for the entry.',M,top+42,CONTENT,size=8.8,leading=12,maxheight=36)
c.showPage()
# 4: evidence, evaluation, entry references
base(c,4,'Evidence and judge access.','04 / WHAT IS VERIFIED')
box(c,M,180,CONTENT,94)
paragraph(c,'<b>Real Twitch-source round:</b> 12 coins, four gravity shifts, automatic completion and a confirmed PostgreSQL result. The first third-coin effect expired after <b>4,002 ms</b>. Downloaded controller events, backend state and a direct read-only database query match.',M+16,196,CONTENT-32,size=10.6,leading=15,maxheight=65)
y=296;label(c,'EVIDENCE BOUNDARIES',M,y)
y=paragraph(c,'The public Twitch excerpt shows the app idle in a real broadcast. Gameplay close-ups are a separate verified Twitch-source round. The proposal was approved before filming. Rehearsal and 3D explanation are labelled separately. Scores and effect timestamps remain controller-reported observations.',M,y+24,CONTENT,size=10.2,leading=14.5,maxheight=90)
y=section(c,'LOCAL EVALUATION',y+24)
y=paragraph(c,'Use Node 24+, Go 1.26+ and an existing PostgreSQL 18 server with dedicated application/test databases. Install web dependencies with <font name="Mono">npm ci</font> in <font name="Mono">web/</font>. Copy the backend environment example without overwriting existing settings, then configure database URLs and your own Twitch app credentials privately.',M,y,CONTENT,size=10,leading=14,maxheight=100)
box(c,M,y+14,CONTENT,70)
for i,command in enumerate(['node scripts/doctor.mjs','node scripts/verify.mjs','node scripts/dev.mjs --live']):text(c,command,M+14,y+26+i*17,9.2,'Mono',CYAN)
y=y+101
y=paragraph(c,'Open http://localhost:5174, connect the broadcaster account, send the example rule in that real channel and use A/D or arrow keys plus Space. The exact OAuth callback is http://localhost:8080/auth/twitch/callback. Keep tokens and credentials out of submission materials.',M,y,CONTENT,size=9.7,leading=13.5,maxheight=70)
y=section(c,'ENTRY REFERENCES',y+23)
y=link(c,'Demo video: youtu.be/AvWHm6U2jUs',DATA['demo_video'],M,y)
if DATA.get('repository'):y=link(c,'Source: github.com/fadillaoegi/ruleshiftlive-twitchcodex',DATA['repository'],M,y+7)
else:y=paragraph(c,'Repository access must be supplied with the Devpost entry; a repository URL has not been provided for this brief.',M,y+6,CONTENT,size=9.1,leading=12,maxheight=30)
y=link(c,'Codex x TwitchCon - Official Rules',DATA['rules'],M,y+9)
paragraph(c,'The rules require the project, repository access, an English description, the principal Codex session ID and a YouTube demonstration shorter than three minutes. This PDF is supporting material, not a replacement for the entry form. Participant eligibility, ownership, viewing access and final Submitted status require entrant confirmation.',M,y+15,CONTENT,size=8.7,leading=12,maxheight=64)
c.save()

poster=OUT/'ruleshift-live-poster-a3.pdf'
if '--brief-only' not in sys.argv:
    p=canvas.Canvas(str(poster),pagesize=A3,pageCompression=1);p.setTitle('RuleShift Live - A3 Poster');p.setAuthor('RuleShift Live');p.setSubject('Original RuleShift Live promotional poster');p.setCreator('Remotion artwork with ReportLab PDF packaging')
    w,h=A3;p.drawImage(str(DESIGN/'poster-a3.jpg'),0,0,width=w,height=h)
    p.linkURL(DATA['demo_video'],(w*.73,h*.015,w*.945,h*.13),relative=0,thickness=0);p.showPage();p.save()
for path,count in [(file,4),(poster,1)]:
    reader=PdfReader(path)
    if len(reader.pages)!=count:raise ValueError('Unexpected PDF page count')
reader=PdfReader(file);alltext='\n'.join(p.extract_text() or '' for p in reader.pages)
for required in ['4,002','Codex','PostgreSQL','AvWHm6U2jUs',DATA['codex_session']]:
    if required not in alltext:raise ValueError('Missing brief content: '+required)
if '\u25a0' in alltext:raise ValueError('Missing-glyph square found')
(OUT/'brief-text-check.txt').write_text(alltext)
(OUT/'document-info.json').write_text(json.dumps({'created_at':datetime.now(timezone.utc).isoformat(),'brief':file.name,'brief_pages':4,'poster':poster.name,'poster_pages':1,'language':'en','demo_video':DATA['demo_video'],'repository_provided':bool(DATA.get('repository')),'recorded_codex_session':DATA['codex_session'],'pdf_text_checks':'passed','visual_review':'Pending rendered-page inspection','limits':['Supplementary project brief; not a full Devpost eligibility/submission certification.','YouTube oEmbed metadata is reachable, but complete unauthenticated playback has not been verified.']},indent=2)+'\n')
print('Created four-page project brief and A3 poster PDF. Text and link content checks passed.')
