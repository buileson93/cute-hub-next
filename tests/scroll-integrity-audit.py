import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/scroll_audit")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def check_route(page, route_path, name):
    print(f"Checking {route_path}...")
    await page.goto(f"http://localhost:8080{route_path}")
    # Wait for content or auth redirect
    await page.wait_for_timeout(4000)
    
    if "auth" in page.url:
        print(f"Skipping {route_path} - Redirected to auth.")
        return

    # Take initial screenshot
    await page.screenshot(path=str(SCREENSHOTS / f"{name}_1_top.png"))
    
    # Detect header by semantic tag or component marker
    header = page.locator('header[data-component="PageHeader"], header.sticky, header').first
    if await header.count() == 0:
        print(f"Warning: No Header found on {route_path}")
        return
        
    box1 = await header.bounding_box()
    if not box1:
        print(f"Warning: Header has no bounding box on {route_path}")
        return
    y1 = box1['y']
    
    # Try to scroll content
    scrollable = page.locator('.mirats-scroll, .overflow-y-auto').first
    if await scrollable.count() > 0:
        print(f"Scrolling container on {name}...")
        await scrollable.evaluate("el => el.scrollTop = 500")
        await page.wait_for_timeout(1000)
    else:
        print(f"Scrolling page on {name}...")
        await page.mouse.wheel(0, 500)
        await page.wait_for_timeout(1000)
        
    # Take scrolled screenshot
    await page.screenshot(path=str(SCREENSHOTS / f"{name}_2_scrolled.png"))
    
    # Get Header Y position again
    box2 = await header.bounding_box()
    y2 = box2['y']
    
    diff = abs(y1 - y2)
    print(f"Route {route_path}: Header Y shift = {diff}px")
    
    if diff > 5:
        print(f"FAIL: Header on {route_path} moved by {diff}px!")
    else:
        print(f"PASS: Header on {route_path} remained fixed.")

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        
        # Determine if we can inject session
        session_file = os.path.expanduser("~/.cache/lovable-auth/session.json")
        page = await context.new_page()

        if os.path.exists(session_file):
            with open(session_file) as f:
                minted = json.load(f)
            storage_key = minted["storage_key"]
            session_json = json.dumps(minted["session"])
            cookies = minted["cookies"]
            
            for c in cookies:
                c["url"] = "http://localhost:8080"
            await context.add_cookies(cookies)
            
            await page.goto("http://localhost:8080")
            await page.evaluate(
                f"window.localStorage.setItem({json.dumps(storage_key)}, {session_json})"
            )
            print("Auth session restored from cache.")
        else:
            print("No auth session cache found.")

        routes = [
            ("/", "dashboard"),
            ("/tong-quan", "overview"),
            ("/thiet-bi", "devices"),
            ("/admin/audit", "audit")
        ]
        
        for path, name in routes:
            try:
                await check_route(page, path, name)
            except Exception as e:
                print(f"Error checking {path}: {e}")
                
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
