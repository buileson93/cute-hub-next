import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/full_site_integrity")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

ROUTES = [
    ("Dashboard", "http://localhost:8080/"),
    ("Overview", "http://localhost:8080/tong-quan"),
    ("Devices", "http://localhost:8080/thiet-bi"),
    ("System Tree", "http://localhost:8080/he-thong/cay"),
]

VIEWPORTS = [
    {"name": "Desktop", "width": 1280, "height": 800},
    {"name": "Tablet", "width": 768, "height": 1024},
    {"name": "Mobile", "width": 375, "height": 667},
]

async def audit_route(page, route_name, url, viewport_name):
    print(f"[{viewport_name}] Auditing {route_name}: {url}")
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_timeout(3000)

    # Detect Header and Sidebar
    header = page.locator('header[role="banner"], header[data-component="PageHeader"], .sticky').first
    sidebar = page.locator('aside, [role="navigation"]').first
    
    h_box1 = await header.bounding_box()
    s_box1 = await sidebar.bounding_box()
    
    # Check PageBody A11y
    body = page.locator('div[role="main"]')
    if await body.count() > 0:
        tab_index = await body.get_attribute("tabindex")
        if tab_index == "0":
            print(f"  [PASS] PageBody is focusable (tabindex=0)")
        else:
            print(f"  [FAIL] PageBody missing tabindex=0")
    
    # Scroll content
    scrollable = page.locator('.mirats-scroll, div[role="main"]').first
    if await scrollable.count() > 0:
        await scrollable.evaluate("el => el.scrollTop = 400")
        await page.wait_for_timeout(1000)
    else:
        print("  WARNING: No scrollable PageBody found")

    # Verify positions
    if h_box1:
        h_box2 = await header.bounding_box()
        h_diff = abs(h_box1['y'] - h_box2['y'])
        if h_diff < 5:
            print(f"  [PASS] Header fixed (shift {h_diff}px)")
        else:
            print(f"  [FAIL] Header moved {h_diff}px")
            
    if s_box1 and viewport_name == "Desktop":
        s_box2 = await sidebar.bounding_box()
        s_diff = abs(s_box1['x'] - s_box2['x'])
        if s_diff < 5:
            print(f"  [PASS] Sidebar fixed (shift {s_diff}px)")
        else:
            print(f"  [FAIL] Sidebar moved {s_diff}px")

    await page.screenshot(path=str(SCREENSHOTS / f"{viewport_name}_{route_name}_final.png"))

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        
        # Auth restore
        session_file = os.path.expanduser("~/.cache/lovable-auth/session.json")
        
        for vp in VIEWPORTS:
            context = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            page = await context.new_page()
            
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
                try:
                    await audit_route(page, name, url, vp["name"])
                except Exception as e:
                    print(f"Error auditing {name} on {vp['name']}: {e}")
            
            await context.close()
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
