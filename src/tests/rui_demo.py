from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':1300}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://' + __import__('os').getcwd() + '/rechner-beispiel.html'); pg.wait_for_timeout(5000)
    h0=pg.inner_text('#headline').split('\n')[0]
    # Schnell Schritt 3
    pg.evaluate('document.querySelector("[data-qgo=\'3\']").click()'); pg.wait_for_timeout(500)
    pg.click('#qk [data-yn=rOn] [data-v="1"]'); pg.wait_for_timeout(9000)
    pg.screenshot(path='/tmp/r_qk3.png', full_page=True)
    print('Schnell, Hinweis:', pg.inner_text('#rent-h'))
    print('vorher:', h0, '| nachher:', pg.inner_text('#headline').split('\n')[0])
    # Einfach Schritt 5
    pg.click('[data-view=easy]'); pg.wait_for_timeout(600); pg.evaluate('document.querySelector("#wiz [data-go=\'5\']").click()'); pg.wait_for_timeout(600)
    print("Einfach sichtbar:", pg.is_visible("#wiz #rbuyY"), pg.is_visible("#wiz #rkost"), pg.is_visible("#wiz #rent-h"))
    # Ausführlich
    pg.click('[data-view=full]'); pg.wait_for_timeout(600); pg.evaluate('document.getElementById("sec-miete").open=true')
    print('Ausführlich Zusammenfassung:', pg.inner_text('#sum-miete'), '| Felder:', pg.evaluate('document.querySelectorAll("#sec-miete input[type=range]").length'))
    with pg.expect_download(timeout=60000) as d: pg.evaluate('document.getElementById("pdf-b").click()')
    d.value.save_as('/tmp/rent.pdf')
    print('Fehler:', errs); b.close()
