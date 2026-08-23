import asyncio
import os
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/catalog_layout_check")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

# Các route để kiểm tra
ROUTES = [
    ("ViTri", "http://localhost:8080/danh-muc/vi-tri"),
    ("DacTinh", "http://localhost:8080/danh-muc/dac-tinh"),
]

VIEWPORTS = [
    {"name": "Desktop", "width": 1280, "height": 800},
]

async def check_layout(page, route_name, url, viewport_name):
    print(f"[{viewport_name}] Checking {route_name}: {url}")
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(5000) # Chờ hydrate & data
    except Exception as e:
        print(f"  [ERROR] Navigation failed: {e}")
        return

    # 1. PageFrame check
    frame = page.locator('.h-dvh.overflow-hidden').first
    if await frame.count() > 0:
        print(f"  [PASS] PageFrame (overflow-hidden) found")
    else:
        print(f"  [FAIL] PageFrame NOT found")

    # 2. PageHeader check
    header = page.locator('.astryx-page-header').first
    if await header.count() > 0:
        box = await header.bounding_box()
        print(f"  [PASS] PageHeader found at y={box['y']}")
    else:
        print(f"  [FAIL] PageHeader NOT found")

    # 3. PageBody check
    body = page.locator('[role="main"].astryx-page-body').first
    if await body.count() > 0:
        tab_index = await body.get_attribute("tabindex")
        print(f"  [PASS] PageBody (main role) found with tabindex={tab_index}")
        
        # Check scrollability
        initial_box = await header.bounding_box()
        # Scroll the PageBody
        await body.evaluate("el => el.scrollTop = 200")
        await page.wait_for_timeout(500)
        
        after_box = await header.bounding_box()
        if abs(initial_box['y'] - after_box['y']) < 1:
            print(f"  [PASS] Header remained FIXED during internal scroll")
        else:
            print(f"  [FAIL] Header MOVED during internal scroll (diff={after_box['y'] - initial_box['y']})")
    else:
        print(f"  [FAIL] PageBody NOT found")

    await page.screenshot(path=str(SCREENSHOTS / f"{viewport_name}_{route_name}.png"))

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        
        # Tự động lấy session nếu có thể
        auth_status = os.environ.get("LOVABLE_BROWSER_AUTH_STATUS")
        print(f"Auth Status: {auth_status}")
        
        for vp in VIEWPORTS:
            context = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            page = await context.new_page()
            
            # Giả định session đã được injected vào env nếu chạy trong sandbox với auth
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
            
            for name, url in ROUTES:
                await check_layout(page, name, url, vp["name"])
            
            await context.close()
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
