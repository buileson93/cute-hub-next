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
    ("LoaiThietBi", "http://localhost:8080/danh-muc/loai-thiet-bi"),
    ("NhaSanXuat", "http://localhost:8080/danh-muc/nha-san-xuat"),
    ("NhaCungCap", "http://localhost:8080/danh-muc/nha-cung-cap"),
    ("DonVi", "http://localhost:8080/danh-muc/don-vi"),
]

async def check_layout(page, route_name, url):
    print(f"Checking {route_name}: {url}")
    try:
        await page.goto(url, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)
    except Exception as e:
        print(f"  [ERROR] Navigation failed: {e}")
        return

    # Check Header fixed
    header = page.locator('.astryx-page-header, [role="banner"]').first
    if await header.count() > 0:
        is_sticky = await header.evaluate("el => { const s = window.getComputedStyle(el); return s.position === 'sticky' || s.position === 'fixed'; }")
        role = await header.get_attribute("role")
        print(f"  [PASS] Header found (sticky={is_sticky}, role={role})")
    else:
        print(f"  [FAIL] Header NOT found")

    # Check PageBody scrollable & A11y
    body = page.locator('.astryx-page-body, [role="main"]').first
    if await body.count() > 0:
        overflow = await body.evaluate("el => window.getComputedStyle(el).overflowY")
        role = await body.get_attribute("role")
        tabindex = await body.get_attribute("tabindex")
        print(f"  [PASS] PageBody found (overflowY={overflow}, role={role}, tabindex={tabindex})")
        
        # Verify it doesn't scroll the root if it's supposed to be internal scroll
        root_overflow = await page.evaluate("() => window.getComputedStyle(document.documentElement).overflow")
        print(f"  [INFO] Root overflow: {root_overflow}")
    else:
        print(f"  [FAIL] PageBody NOT found")

    await page.screenshot(path=str(SCREENSHOTS / f"{route_name}.png"))

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        # Check both Desktop and Mobile
        for viewport in [{"width": 1280, "height": 800}, {"width": 375, "height": 812}]:
            vp_name = "desktop" if viewport["width"] > 500 else "mobile"
            print(f"\n--- Testing Viewport: {vp_name} ---")
            context = await browser.new_context(viewport=viewport)
            page = await context.new_page()

            # Try to restore session
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
                await check_layout(page, f"{vp_name}_{name}", url)
            
            await context.close()
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())