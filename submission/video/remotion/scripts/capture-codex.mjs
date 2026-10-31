// Capture an already-inspected real Codex terminal window. No synthetic UI.
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('../../../../',import.meta.url));
const dir=resolve(root,'.local/video-capture');await mkdir(dir,{recursive:true});
const seconds=42;
const file=resolve(dir,'codex-development-raw.mov');
const child=spawn('screencapture',['-v','-V',String(seconds),'-l','59','-x',file],{detached:true,stdio:'ignore'});
await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
child.unref();
await writeFile(resolve(dir,'codex-capture-start.json'),JSON.stringify({started_at:new Date().toISOString(),duration_limit_seconds:seconds,window_id:59,application:'Warp running the real RuleShift Codex session',file:'codex-development-raw.mov',capture:'Native macOS video capture; crop out sidebar and unrelated projects before use',pid:child.pid},null,2)+'\n');
console.log(`Real Codex window capture started for ${seconds} seconds. Continue with actual source inspection and verification.`);
