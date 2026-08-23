import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/scroll_audit")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def check_route(page, route_path, name):
    print(f"Checking {route_path}...")
    await page.goto(f"http://localhost:8080{route_path}")
    # Wait for content
    await page.wait_for_timeout(2000)
    
    # 1. Take initial screenshot
    await page.screenshot(path=str(SCREENSHOTS / f"{name}_1_top.png"))
    
    # 2. Get Header Y position
    header_selector = '[data-component="PageHeader"]'
    header = page.locator(header_selector)
    if await header.count() == 0:
        print(f"Warning: No PageHeader found on {route_path}")
        return
        
    box1 = await header.bounding_box()
    y1 = box1['y']
    
    # 3. Try to scroll content
    # Look for mirats-scroll or scrollable PageBody
    scrollable = page.locator('.mirats-scroll, .overflow-y-auto').first
    if await scrollable.count() > 0:
        await scrollable.evaluate("el => el.scrollTop = 500")
        await page.wait_for_timeout(500)
    else:
        # Fallback scroll page
        await page.mouse.wheel(0, 500)
        await page.wait_for_timeout(500)
        
    # 4. Take scrolled screenshot
    await page.screenshot(path=str(SCREENSHOTS / f"{name}_2_scrolled.png"))
    
    # 5. Get Header Y position again
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
        # Auth injection if available
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        
        # Check if auth exists
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        
        page = await context.new_page()
        
        if storage_key and session_json:
            await page.goto("http://localhost:8080")
            await page.evaluate(
                f"window.localStorage.setItem('{storage_key}', '{session_json}')"
            )
            print("Auth session injected.")

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
