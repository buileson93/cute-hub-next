import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/catalog_layout_check")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def check_layout(page, route_name, url, viewport_name):
    print(f"[{viewport_name}] Checking {route_name}: {url}")
    try:
        await page.goto(url, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)
    except Exception as e:
        print(f"  [ERROR] Navigation failed: {e}")
        return

    # 1. PageFrame check
    frame = page.locator('div.h-dvh.overflow-hidden, div.h-screen.overflow-hidden').first
    if await frame.count() > 0:
        print(f"  [PASS] PageFrame found")
    else:
        print(f"  [FAIL] PageFrame NOT found")

    # 2. PageHeader check
    header = page.locator('.astryx-page-header, [data-component="PageHeader"]').first
    if await header.count() > 0:
        box = await header.bounding_box()
        print(f"  [PASS] PageHeader found at y={box['y'] if box else 'unknown'}")
    else:
        print(f"  [FAIL] PageHeader NOT found")

    # 3. PageBody check
    body = page.locator('.astryx-page-body, [role="main"]').first
    if await body.count() > 0:
        tab_index = await body.get_attribute("tabindex")
        print(f"  [PASS] PageBody found with tabindex={tab_index}")
    else:
        print(f"  [FAIL] PageBody NOT found")

    await page.screenshot(path=str(SCREENSHOTS / f"{viewport_name}_{route_name}.png"))

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        
        # Check if we have a session file
        session_file = os.path.expanduser("~/.cache/lovable-auth/session.json")
        
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        if os.path.exists(session_file):
            print(f"Found session file at {session_file}")
            with open(session_file) as f:
                minted = json.load(f)
            storage_key = minted["storage_key"]
            session_json = json.dumps(minted["session"])
            cookies = minted.get("cookies", [])
            for c in cookies:
                c["url"] = "http://localhost:8080"
            await context.add_cookies(cookies)
            await page.goto("http://localhost:8080")
            await page.evaluate(f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})")
            print("Session restored from file")
        else:
            print("No session file found, checking env vars...")
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
                print("Session restored from env vars")

        await check_layout(page, "ViTri", "http://localhost:8080/danh-muc/vi-tri", "Desktop")
        await check_layout(page, "DacTinh", "http://localhost:8080/danh-muc/dac-tinh", "Desktop")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
