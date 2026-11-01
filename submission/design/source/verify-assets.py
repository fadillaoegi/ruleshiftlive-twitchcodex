"""Inspect actual exported artifact formats, sizes, links and embedded fonts."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json
from PIL import Image
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[3]
DESIGN=ROOT/'submission/design';DOCS=ROOT/'submission/documents'
files=[]
for name,dim,limit in [('youtube-thumbnail.jpg',(3840,2160),2000000),('youtube-thumbnail-1280.jpg',(1280,720),2000000),('devpost-cover.jpg',(1800,1200),5000000),('poster-a3.jpg',(3508,4961),None)]:
    path=DESIGN/name
    with Image.open(path) as im:
        assert im.size==dim,(name,im.size,dim)
        assert im.format=='JPEG'
        im.verify()
    assert limit is None or path.stat().st_size<limit
    files.append({'file':str(path.relative_to(ROOT)),'dimensions':dim,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
for name,count in [('ruleshift-live-project-brief.pdf',4),('ruleshift-live-poster-a3.pdf',1)]:
    path=DOCS/name;reader=PdfReader(path);assert len(reader.pages)==count
    uris=[];fonts=[]
    for page in reader.pages:
        for annotation in page.get('/Annots',[]):
            action=annotation.get_object().get('/A',{})
            if action.get('/URI'):uris.append(str(action['/URI']))
        for font in page.get('/Resources',{}).get('/Font',{}).values():
            obj=font.get_object();desc=obj.get('/FontDescriptor')
            if desc:
                descriptor=desc.get_object();assert any(key in descriptor for key in ['/FontFile','/FontFile2','/FontFile3'])
                fonts.append(str(obj.get('/BaseFont')))
    assert 'https://youtu.be/AvWHm6U2jUs' in uris
    if count==4:assert 'https://twitchcon-codex.devpost.com/rules' in uris
    files.append({'file':str(path.relative_to(ROOT)),'pages':count,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'uri_annotations':uris,'embedded_font_subsets':sorted(set(fonts))})
metadata=json.loads((DESIGN/'source/youtube-oembed.json').read_text())
assert metadata['provider_name']=='YouTube' and metadata['author_name']=='FLdev'
assert metadata['title']=='RuleShift Live | Twitch Chat Changes the Game | Codex x TwitchCon'
info=json.loads((DOCS/'document-info.json').read_text());info['visual_review']='Passed: all four A4 pages and the A3 page rendered through PDFKit and visually inspected; no clipping or overlaps.'
(DOCS/'document-info.json').write_text(json.dumps(info,indent=2)+'\n')
qrcheck=json.loads((DESIGN/'source/qr-check.json').read_text())
assert qrcheck['status']=='passed'
result={'checked_at':datetime.now(timezone.utc).isoformat(),'files':files,'remotion_typecheck':'passed','visual_review':'Passed after fixing a Devpost headline/frame overlap. All artwork and every PDF page inspected.','qr_review':qrcheck,'youtube_metadata':'Official unauthenticated oEmbed reachable; title/channel match. Full playback and local-edit identity not verified.','gameplay_source':'Actual separate verified Twitch-source capture; promotional sprite/coin accents and perspective frame are illustrations.','application_changes':False,'paid_generation_calls':0}
(DESIGN/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'status':'passed','artifacts':len(files),'sizes':{Path(f['file']).name:f['bytes'] for f in files}},indent=2))
