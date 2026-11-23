"""Снимает подтверждённые состояния мобильного прототипа для ролика."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "screens"

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={"width": 430, "height": 932}, device_scale_factor=2)
    page.goto("http://127.0.0.1:4174/", wait_until="networkidle")
    OUT.mkdir(exist_ok=True)
    page.screenshot(path=OUT / "home.png")

    page.click('button[data-vertical="buy"]')
    page.fill("#location-input", "Ясенево")
    page.click('button[data-room="2"]')
    page.fill("#budget-input", "18000000")
    page.check("#save-input")
    page.screenshot(path=OUT / "search.png")

    page.click("#apply-search")
    page.wait_for_timeout(100)
    page.screenshot(path=OUT / "saved-search.png")
    browser.close()
