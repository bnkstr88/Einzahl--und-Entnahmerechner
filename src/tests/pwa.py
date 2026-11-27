from playwright.sync_api import sync_playwright
import json
def setr(pg,id,v): pg.evaluate(f'(()=>{{const e=document.getElementById("{id}");e.value={v};e.dispatchEvent(new Event("input",{{bubbles:true}}));e.dispatchEvent(new Event("change",{{bubbles:true}}))}})()')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':900}); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8765/'); pg.wait_for_timeout(4000)
    print('SW:', pg.evaluate('navigator.serviceWorker.getRegistration().then(r=>!!r)'))
    print('Manifest:', pg.evaluate('fetch("manifest.webmanifest").then(r=>r.json()).then(j=>j.name)'))
    pg.click('[data-view=full]'); pg.wait_for_timeout(600)
    pg.evaluate('for (const d of document.querySelectorAll("details")) d.open=true')
    # Eigene Werte setzen
    setr(pg,'inc0',4500); setr(pg,'contrib',200); setr(pg,'pens',3150)
    pg.check('#pOn'); pg.check('#home'); pg.click('[data-kvm=pkv]'); pg.click('[data-wmode=dyn]'); pg.click('[data-scen=v]')
    pg.fill('#cap-n','183456'); pg.press('#cap-n','Enter'); pg.wait_for_timeout(4000)
    a=pg.evaluate('JSON.stringify(readParams())'); h1=pg.inner_text('#headline')
    pg.wait_for_timeout(800); pg.reload(); pg.wait_for_timeout(5000)
    bb=pg.evaluate('JSON.stringify(readParams())'); h2=pg.inner_text('#headline')
    A=json.loads(a); B=json.loads(bb); diff={k:(A[k],B.get(k)) for k in A if A[k]!=B.get(k)}
    print('nach Neuladen gleich:', not diff, diff, '|', h1==h2, h2)
    print('Ansicht nach Neuladen:', pg.evaluate('[...document.querySelectorAll("[data-view]")].find(x=>x.getAttribute("aria-pressed")==="true").dataset.view'))
    # offline
    ctx.set_offline(True); pg.reload(); pg.wait_for_timeout(5000)
    print('offline:', pg.inner_text('#headline')[:60])
    ctx.set_offline(False)
    # Zurücksetzen
    pg.click('[data-view=full]'); pg.wait_for_timeout(300); pg.click('#reset'); pg.wait_for_timeout(1500); pg.reload(); pg.wait_for_timeout(4000)
    print('nach Zurücksetzen Netto/Depot:', pg.input_value('#inc0-n'), pg.input_value('#cap-n'))
    print('Fehler:', errs); b.close()
