import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/scroll-integrity/screenshots")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def check_route(page, route_name, url):
    print(f"Checking {route_name}: {url}")
    await page.goto(url, wait_until="networkidle")
    await page.wait_for_timeout(2000) # Wait for potential layout shifts
    
    # Take initial screenshot
    await page.screenshot(path=str(SCREENSHOTS / f"{route_name}_top.png"))
    
    # Check if PageHeader is visible and sticky
    header = page.locator("header, .page-header, [data-component='PageHeader']").first
    header_box = await header.bounding_box()
    if header_box:
        print(f"  Header found at y={header_box['y']}")
    else:
        print("  WARNING: Header not found with standard selectors")

    # Try to scroll a specific scrollable area if identified, or body
    # We want to see if PageBody is scrolling while Header stays put
    scrollable = page.locator(".mirats-scroll, .overflow-y-auto").first
    if await scrollable.count() > 0:
        await scrollable.evaluate("el => el.scrollTop = 500")
        print("  Scrolled content area 500px")
    else:
        await page.evaluate("window.scrollTo(0, 500)")
        print("  Scrolled window 500px")
    
    await page.wait_for_timeout(1000)
    await page.screenshot(path=str(SCREENSHOTS / f"{route_name}_scrolled.png"))
    
    # Check header position again
    if header_box:
        new_header_box = await header.bounding_box()
        if new_header_box:
             diff = abs(new_header_box['y'] - header_box['y'])
             if diff < 5:
                 print(f"  SUCCESS: Header is sticky (moved {diff}px)")
             else:
                 print(f"  FAILURE: Header moved by {diff}px")

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Auth
        session_file = os.path.expanduser("~/.cache/lovable-auth/session.json")
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
        else:
            print("No session file found, skipping auth restore")

        routes = [
            ("dashboard", "http://localhost:8080/"),
            ("tong-quan", "http://localhost:8080/tong-quan"),
            ("thiet-bi", "http://localhost:8080/thiet-bi"),
            ("thanh-phan", "http://localhost:8080/he-thong/thanh-phan"),
            ("audit", "http://localhost:8080/admin/audit")
        ]

        for name, url in routes:
            try:
                await check_route(page, name, url)
            except Exception as e:
                print(f"Error checking {name}: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
