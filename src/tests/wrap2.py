from playwright.sync_api import sync_playwright
import json,sys
WIDTHS=[int(x) for x in sys.argv[2].split(',')]
FILES=sys.argv[1].split(',')
JS = r'''() => {
  const out = {pairs: {}, overflow: [], splits: []};
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const re = /(\d[\d.,]*) (%|€|Jahre|Jahren|Jahr|Pkt\.|m²|Mio\.|Monate)/g;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) {
    const p = n.parentElement; if (!p || !vis(p) || p.closest('script,style')) continue;
    const t = n.textContent; let m; re.lastIndex = 0;
    while ((m = re.exec(t))) {
      // wirklich umgebrochen? Bereich Zahl..Einheit hat zwei Zeilen
      const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
      const rects = [...r.getClientRects()].filter(x => x.width > 0); const tops = new Set(rects.map(x => Math.round(x.top)));
      const k = (p.id || p.className || p.tagName) + ': ' + m[0];
      out.pairs[k] = (out.pairs[k] || 0) + 1;
      if (tops.size > 1) out.splits.push((p.id ? '#' + p.id : p.className || p.tagName) + ' | ' + t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 10).replace(/\s+/g, ' '));
    }
  }
  document.querySelectorAll('body *').forEach(el => { if (!vis(el)) return; if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === 'visible' && el.clientWidth > 0 && !['svg','path','text'].includes(el.tagName.toLowerCase())) out.overflow.push((el.id ? '#' + el.id : el.tagName + '.' + el.className) + ' ' + el.scrollWidth + '>' + el.clientWidth); });
  out.docW = document.documentElement.scrollWidth; return out;
}'''
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    allsplits=set(); allpairs=set(); ov=set()
    for f in FILES:
      for W in WIDTHS:
        pg=b.new_page(viewport={'width':W,'height':900})
        pg.goto('file://'+__import__('os').getcwd()+'/'+f); pg.wait_for_timeout(2500)
        for view in ['quick','easy','full']:
            pg.click(f'[data-view={view}]'); pg.wait_for_timeout(1500)
            steps = range(1,6) if view=='quick' else range(1,9) if view=='easy' else [0]
            for s in steps:
                if view=='quick': pg.evaluate(f'(()=>{{const b=document.querySelector("[data-qgo=\'{s}\']"); if(b) b.click();}})()')
                if view=='easy': pg.evaluate(f'(()=>{{const b=document.querySelector("#wiz [data-go=\'{s}\']"); if(b) b.click();}})()')
                if view=='full': pg.evaluate('document.querySelectorAll("details").forEach(d=>d.open=true)')
                pg.wait_for_timeout(4500 if (view=='quick' and s==5) or (view=='easy' and s>=8) or view=='full' else 400)
                r=pg.evaluate(JS)
                for x in r['splits']: allsplits.add(f'{W} {view}{s}: {x}')
                for k in r['pairs']: allpairs.add(k)
                for x in r['overflow']: ov.add(f'{W} {view}: {x}')
                if r['docW']>W+1: ov.add(f'{W} {view}{s}: Seite breiter {r["docW"]}')
        pg.close()
    b.close()
print('UMBRUECHE ZWISCHEN ZAHL UND EINHEIT:', len(allsplits)); [print(' ',x) for x in sorted(allsplits)]
print('UEBERLAUF:', len(ov)); [print(' ',x) for x in sorted(ov)[:40]]
print('STELLEN MIT NORMALEM LEERZEICHEN (Elemente):', len(allpairs)); [print(' ',x) for x in sorted(allpairs)[:80]]
