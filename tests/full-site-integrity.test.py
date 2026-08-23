import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/full_site_integrity")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

# Các route để kiểm tra
ROUTES = [
    ("Dashboard", "http://localhost:8080/"),
    ("Devices", "http://localhost:8080/thiet-bi"),
    ("Overview", "http://localhost:8080/tong-quan"),
]

VIEWPORTS = [
    {"name": "Desktop", "width": 1280, "height": 800},
    {"name": "Mobile", "width": 375, "height": 667},
]

async def audit_route(page, route_name, url, viewport_name):
    print(f"[{viewport_name}] Auditing {route_name}: {url}")
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(3000)
    except Exception as e:
        print(f"  [ERROR] Navigation failed: {e}")
        return

    # 1. Kiểm tra Accessibility (A11y)
    body = page.locator('[role="main"]').first
    if await body.count() > 0:
        tab_index = await body.get_attribute("tabindex")
        role = await body.get_attribute("role")
        print(f"  [PASS] PageBody A11y: role={role}, tabindex={tab_index}")
    else:
        # Kiểm tra theo class fallback
        body_fallback = page.locator('.astryx-page-body').first
        if await body_fallback.count() > 0:
             role = await body_fallback.get_attribute("role")
             print(f"  [FAIL] PageBody found by class but role='{role}' (expected 'main')")
        else:
             print(f"  [WARN] No PageBody found")

    # 2. Kiểm tra Header cố định
    # AppShell header (Global)
    global_header = page.locator('header[role="banner"]').first
    # Page-level header
    page_header = page.locator('.astryx-page-header').first
    
    headers = []
    if await global_header.count() > 0: headers.append(("GlobalHeader", global_header))
    if await page_header.count() > 0: headers.append(("PageHeader", page_header))

    if not headers:
        print("  [WARN] No headers found")
    else:
        # Lưu vị trí ban đầu
        initial_boxes = []
        for name, loc in headers:
            box = await loc.bounding_box()
            if box: initial_boxes.append((name, loc, box))

        # Cuộn
        scrollable = page.locator('.mirats-scroll, [role="main"], .astryx-page-body').first
        if await scrollable.count() > 0:
            await scrollable.evaluate("el => el.scrollTop = 300")
            await page.wait_for_timeout(500)
            
            for name, loc, box1 in initial_boxes:
                box2 = await loc.bounding_box()
                diff = abs(box1['y'] - box2['y'])
                if diff < 2:
                    print(f"  [PASS] {name} fixed (shift {diff}px)")
                else:
                    print(f"  [FAIL] {name} moved {diff}px")
        else:
            # Nếu không thấy container cuộn, thử cuộn window
            await page.mouse.wheel(0, 300)
            await page.wait_for_timeout(500)
            for name, loc, box1 in initial_boxes:
                box2 = await loc.bounding_box()
                diff = abs(box1['y'] - box2['y'])
                print(f"  [INFO] Window scroll: {name} shift {diff}px")

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
