// 관리자(Supabase)에 저장된 링크 미리보기(OG) 설정을 index.html 의 <!-- OG:START --> ~ <!-- OG:END --> 사이에 써 넣습니다.
// 링크 미리보기 크롤러(카카오톡·디스코드·트위터 등)는 자바스크립트를 실행하지 않아서, 정적 HTML 에 직접 들어 있어야 보입니다.
const fs = require('fs');
const FILE = 'index.html';
const html = fs.readFileSync(FILE, 'utf8');
const url = /const SUPABASE_URL = '([^']+)'/.exec(html)[1];
const key = /const SUPABASE_KEY = '([^']+)'/.exec(html)[1];
const table = /const TABLE = '([^']+)'/.exec(html)[1];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function main(){
  const r = await fetch(`${url}/rest/v1/${table}?select=*&section=eq.site_og&order=sort_order.asc`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if(!r.ok) throw new Error('조회 실패 ' + r.status);
  const row = (await r.json())[0] || {};
  const title = (row.title || '').trim() || (/<title>([^<]*)<\/title>/.exec(html) || [])[1] || '';
  const desc = (row.summary || '').trim();
  const image = (row.image_url || '').trim();
  const lines = ['<meta property="og:type" content="website">', `<meta property="og:title" content="${esc(title)}">`];
  if(desc) lines.push(`<meta property="og:description" content="${esc(desc)}">`, `<meta name="description" content="${esc(desc)}">`);
  if(image) lines.push(`<meta property="og:image" content="${esc(image)}">`);
  lines.push(`<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`, `<meta name="twitter:title" content="${esc(title)}">`);
  if(desc) lines.push(`<meta name="twitter:description" content="${esc(desc)}">`);
  if(image) lines.push(`<meta name="twitter:image" content="${esc(image)}">`);
  const block = '<!-- OG:START -->\n' + lines.join('\n') + '\n<!-- OG:END -->';
  const next = html.replace(/<!-- OG:START -->[\s\S]*?<!-- OG:END -->/, () => block);
  if(next === html){ console.log('변경 없음'); return; }
  fs.writeFileSync(FILE, next);
  console.log('OG 메타 태그를 갱신했습니다.');
}
main().catch(e => { console.error(e); process.exit(1); });
