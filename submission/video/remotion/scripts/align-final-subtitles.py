"""Align the supplied script to local ASR word timings, preserving brand spelling."""
from pathlib import Path
import difflib, hashlib, json, re, textwrap

ROOT=Path(__file__).resolve().parents[4]
OUT=ROOT/'submission/video/final'
PLAN=json.loads((OUT/'edit-plan.json').read_text())
def norm(text):
    text=re.sub(r'[^a-z0-9]','',text.lower())
    return text.replace('75','seventyfive')
def stamp(seconds,separator=','):
    n=round(seconds*1000)
    return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02}{separator}{n%1000:03}'
cues=[];reports=[];voice=0;all_words={}
for chapter in PLAN['chapters']:
    if not chapter['voice_file']:continue
    voice+=1
    local=ROOT/f'.local/final-demo/asr/voice-{voice}.wav.json'
    raw=json.loads(local.read_text()) if local.exists() else json.loads((OUT/'word-timings.json').read_text())[str(voice)]
    words=[s for s in raw['transcription'] if norm(s['text'])]
    all_words[str(voice)]={'transcription':[{'text':w['text'],'offsets':w['offsets']} for w in words]}
    recognized='';clock=[]
    for word in words:
        token=norm(word['text']);a=word['offsets']['from']/1000;b=word['offsets']['to']/1000
        recognized+=token
        clock.extend([(a+(b-a)*i/max(1,len(token)),a+(b-a)*(i+1)/max(1,len(token))) for i in range(len(token))])
    expected=re.findall(r'\S+',chapter['narration']);flat=''.join(norm(w) for w in expected)
    match=difflib.SequenceMatcher(None,flat,recognized,autojunk=False)
    if match.ratio()<.93:raise ValueError(f'Voice {voice} does not sufficiently match the proposed narration: {match.ratio()}')
    indices=[None]*len(flat)
    for block in match.get_matching_blocks():
        for k in range(block.size):indices[block.a+k]=block.b+k
    last=0
    for i,value in enumerate(indices):
        if value is None:indices[i]=last
        else:last=value
    timed=[];offset=0;previous=0
    for word in expected:
        length=len(norm(word));matched=indices[offset:offset+length];offset+=length
        start=max(previous,clock[min(matched)][0]);end=max(start+.015,clock[max(matched)][1])
        end=min(end,chapter['voice_duration']);timed.append({'text':word,'start':start,'end':end});previous=start
    groups=[];current=[]
    for word in timed:
        candidate=' '.join(w['text'] for w in current+[word])
        if current and (len(candidate)>96 or (word['end']-current[0]['start']>5.4 and len(current)>=4)):
            groups.append(current);current=[]
        current.append(word)
        span=current[-1]['end']-current[0]['start']
        if re.search(r'[.!?;:]$',word['text']) and span>=1.15:
            groups.append(current);current=[]
        elif re.search(r',$',word['text']) and span>=1.8 and len(' '.join(x['text'] for x in current))>=36:
            groups.append(current);current=[]
    if current:groups.append(current)
    shift=chapter['start_frame']/60+chapter['voice_offset']
    for i,group in enumerate(groups):
        text=' '.join(w['text'] for w in group)
        if len(text)<=58:lines=[text]
        else:
            candidates=[i for i,ch in enumerate(text) if ch==' ' and max(i,len(text)-i-1)<=56]
            split=min(candidates,key=lambda i:abs(i-(len(text)-i-1)))
            lines=[text[:split],text[split+1:]]
        if len(lines)>2:raise ValueError('Subtitle exceeds two readable lines')
        start=shift+max(0,group[0]['start']-.04)
        end=shift+min(chapter['voice_duration'],group[-1]['end']+.10)
        if i+1<len(groups):end=min(end,shift+groups[i+1][0]['start']-.05)
        start=round(start*60)/60;end=round(max(start+.18,end)*60)/60
        cues.append({'start':start,'end':end,'text':text,'lines':lines,'chapter':chapter['name'],'voice_file':chapter['voice_file']})
    path=(OUT/chapter['voice_file']).resolve()
    reports.append({'voice_file':chapter['voice_file'],'chapter':chapter['name'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'duration_seconds':chapter['voice_duration'],'timeline_start':shift,'asr_reference_match_ratio':round(match.ratio(),4),'recognized_text':' '.join(w['text'].strip() for w in words)})
for prev,nxt in zip(cues,cues[1:]):
    if prev['end']>nxt['start']:raise ValueError('Overlapping subtitle intervals')
(OUT/'subtitles.json').write_text(json.dumps(cues,indent=2)+'\n')
(OUT/'word-timings.json').write_text(json.dumps(all_words,indent=2)+'\n')
(OUT/'subtitles-en.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n"+'\n'.join(c['lines']) for i,c in enumerate(cues))+'\n')
(OUT/'subtitles-en.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f"{stamp(c['start'],'.')} --> {stamp(c['end'],'.')}\n"+'\n'.join(c['lines']) for c in cues)+'\n')
(OUT/'subtitle-alignment.json').write_text(json.dumps({'method':'Local whisper.cpp 1.8.3 base.en word timings aligned to the user-provided narration script. Reference spelling and punctuation are retained.','language':'en','cue_count':len(cues),'voices':reports,'paid_api_calls':0,'uploaded_audio':False},indent=2)+'\n')
text='# Final demo — timed English narration\n\nUses the eleven original audio clips supplied by the user. Subtitle spelling and punctuation follow this script; timing follows local word-level transcription.\n\n'
for c in PLAN['chapters']:
    text+=f"## {stamp(c['start_frame']/60,'.')}–{stamp((c['start_frame']+c['duration_frames'])/60,'.')} — {c['title'] or c['name']}\n\n"
    if c['voice_file']:text+=f"Audio: `{c['voice_file']}`, begins {c['voice_offset']:.2f} seconds into the chapter.\n\n{c['narration']}\n\n"
    else:text+='No narration. Original music and motion explain this section.\n\n'
(OUT/'VOICEOVER-TIMED.md').write_text(text)
print(json.dumps({'subtitle_cues':len(cues),'voices':voice,'lowest_script_match':min(r['asr_reference_match_ratio'] for r in reports),'duration_seconds':PLAN['duration_seconds']}))
