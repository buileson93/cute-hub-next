import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/ui-audit/screenshots")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Step 1: Navigate to auth and login
        await page.goto("http://localhost:8080/auth", wait_until="networkidle")
        await page.fill("input[id='email']", "buileson93@gmail.com")
        await page.fill("input[id='password']", "12345678")
        
        # Click the blue submit button specifically
        await page.click("button[type='submit']")
        
        # Wait for either navigation or an error toast
        await page.wait_for_timeout(5000)
        
        if page.url == "http://localhost:8080/auth":
            print(f"Login failed. URL still /auth. Looking for error toast...")
            error_toast = page.locator("li[data-sonner-toast][data-type='error']")
            if await error_toast.count() > 0:
                print(f"Error toast found: {await error_toast.inner_text()}")
            await page.screenshot(path=str(SCREENSHOTS / "audit_login_failed_detail.png"))
            await browser.close()
            return
            
        print(f"Login successful? URL is {page.url}")
        await page.wait_for_selector("[data-tour='search']", timeout=10000)

        # Audit TopBar Search
        search_btn = page.locator("div[data-tour='search'] button")
        await search_btn.scroll_into_view_if_needed()
        
        icon = search_btn.locator("svg.lucide-search")
        shortcut = search_btn.locator("div.font-mono")
        text = search_btn.locator("span.truncate")

        icon_box = await icon.bounding_box()
        shortcut_box = await shortcut.bounding_box()
        text_box = await text.bounding_box()

        print(json.dumps({
            "icon": icon_box,
            "shortcut": shortcut_box,
            "text": text_box
        }))

        if text_box and shortcut_box:
            if text_box['x'] + text_box['width'] > shortcut_box['x']:
                print(f"FAILURE: Overlap detected! Text right edge ({text_box['x'] + text_box['width']}) > Shortcut left edge ({shortcut_box['x']})")
            else:
                print("SUCCESS: TopBar Search text is clear of shortcut box.")
        
        await page.screenshot(path=str(SCREENSHOTS / "audit_topbar_final.png"))
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
