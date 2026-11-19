"""Genera el PDF de la presentación: una lámina por página, en formato 1920×1080.

Uso:
    python tools/build_pdf.py [salida.pdf]

Requisitos (una sola vez):
    pip install playwright
    python -m playwright install chromium

GitHub Actions ejecuta este script automáticamente en cada push a la rama main
(ver .github/workflows/presentacion.yml).
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "UTEM-UMD-USP_presentacion.pdf"
URL = (ROOT / "index.html").as_uri() + "?static"

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(URL, wait_until="load")
    page.evaluate("document.fonts.ready.then(() => true)")
    page.wait_for_timeout(1500)

    # Recorre todas las láminas para que cada efecto quede en su estado final
    total = page.evaluate("deck.total")
    for i in range(total):
        page.evaluate(f"deck.go({i})")
        page.wait_for_timeout(100)
    page.evaluate("deck.go(0)")
    page.wait_for_timeout(1500)

    page.emulate_media(media="print")
    page.pdf(
        path=str(OUT),
        width="1920px",
        height="1080px",
        print_background=True,
        prefer_css_page_size=True,
    )
    browser.close()

if errors:
    print("Errores de JavaScript en la presentación:", *errors, sep="\n  ")
    sys.exit(1)
print(f"PDF generado: {OUT} ({total} láminas)")
