import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/full_site_integrity")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

# Giảm số lượng route để tránh timeout, tập trung vào các mẫu layout khác nhau
ROUTES = [
    ("Dashboard", "http://localhost:8080/"),
    ("Devices", "http://localhost:8080/thiet-bi"),
]

VIEWPORTS = [
    {"name": "Desktop", "width": 1280, "height": 800},
    {"name": "Mobile", "width": 375, "height": 667},
]

async def audit_route(page, route_name, url, viewport_name):
    print(f"[{viewport_name}] Auditing {route_name}: {url}")
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(2000)
    except Exception as e:
        print(f"  [ERROR] Navigation failed: {e}")
        return

    # 1. Kiểm tra Accessibility (A11y)
    body = page.locator('div[role="main"]')
    if await body.count() > 0:
        tab_index = await body.get_attribute("tabindex")
        role = await body.get_attribute("role")
        if tab_index == "0" and role == "main":
            print(f"  [PASS] PageBody A11y: role='main', tabindex='0'")
        else:
            print(f"  [FAIL] PageBody A11y: role={role}, tabindex={tab_index}")
    else:
        print(f"  [WARN] No element with role='main' found")

    # 2. Kiểm tra Header cố định
    header = page.locator('header[role="banner"]').first
    if await header.count() > 0:
        box1 = await header.bounding_box()
        if box1:
            # Cuộn PageBody (hoặc main container)
            scrollable = page.locator('.mirats-scroll, div[role="main"]').first
            if await scrollable.count() > 0:
                await scrollable.evaluate("el => el.scrollTop = 300")
                await page.wait_for_timeout(500)
                
                box2 = await header.bounding_box()
                diff = abs(box1['y'] - box2['y'])
                if diff < 2:
                    print(f"  [PASS] Header is fixed (shift {diff}px)")
                else:
                    print(f"  [FAIL] Header moved {diff}px")
    else:
        print("  [WARN] No Header with role='banner' found")

    await page.screenshot(path=str(SCREENSHOTS / f"{viewport_name}_{route_name}.png"))

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        session_file = os.path.expanduser("~/.cache/lovable-auth/session.json")
        
        for vp in VIEWPORTS:
            context = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            page = await context.new_page()
            
            # Restore session
            if os.path.exists(session_file):
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
            
            for name, url in ROUTES:
                await audit_route(page, name, url, vp["name"])
            
            await context.close()
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
