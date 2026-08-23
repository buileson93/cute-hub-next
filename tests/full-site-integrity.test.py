import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/full_site_layout_check")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

ROUTES = [
    ("Dashboard", "http://localhost:8080/"),
    ("Overview", "http://localhost:8080/tong-quan"),
    ("Devices", "http://localhost:8080/thiet-bi"),
    ("Systems", "http://localhost:8080/he-thong/cay"),
    ("Audit", "http://localhost:8080/admin/audit"),
    ("Review", "http://localhost:8080/admin/review"),
    ("ViTri", "http://localhost:8080/danh-muc/vi-tri"),
]

async def check_layout(page, route_name, url):
    print(f"Checking {route_name}: {url}")
    try:
        await page.goto(url, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)
    except Exception as e:
        print(f"  [ERROR] Navigation failed: {e}")
        return

    # Check Sidebar fixed (assume left > 0)
    sidebar = page.locator('aside').first
    if await sidebar.count() > 0:
        box = await sidebar.bounding_box()
        print(f"  [PASS] Sidebar found at x={box['x']}")
    else:
        print(f"  [FAIL] Sidebar NOT found")

    # Check Header fixed
    header = page.locator('.astryx-page-header, header[role="banner"]').first
    if await header.count() > 0:
        box = await header.bounding_box()
        print(f"  [PASS] Header found at y={box['y']}")
    else:
        print(f"  [FAIL] Header NOT found")

    # Check PageBody scrollable
    body = page.locator('.astryx-page-body, [role="main"]').first
    if await body.count() > 0:
        overflow = await body.evaluate("el => window.getComputedStyle(el).overflowY")
        print(f"  [PASS] PageBody found with overflowY={overflow}")
    else:
        print(f"  [FAIL] PageBody NOT found")

    await page.screenshot(path=str(SCREENSHOTS / f"{route_name}.png"))

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # Try to restore session if env vars are present (managed auth)
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")

        if cookies_json:
            cookies = json.loads(cookies_json)
            for c in cookies: c["url"] = "http://localhost:8080"
            await context.add_cookies(cookies)

        await page.goto("http://localhost:8080")
        if storage_key and session_json:
            await page.evaluate(f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})")
            await page.reload(wait_until="networkidle")

        for name, url in ROUTES:
            await check_layout(page, name, url)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
