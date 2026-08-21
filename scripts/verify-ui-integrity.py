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
        
        # Wait for navigation to dashboard or specific G1 page
        try:
            # Dashboard search bar is a good indicator of being logged in
            await page.wait_for_selector("[data-tour='search']", timeout=15000)
            print("Login successful, dashboard loaded.")
        except:
            print(f"Login failed. Current URL: {page.url}")
            await page.screenshot(path=str(SCREENSHOTS / "audit_login_failed_final.png"))
            await browser.close()
            return

        # Step 2: Audit TopBar Search
        search_btn = page.locator("div[data-tour='search'] button")
        await search_btn.scroll_into_view_if_needed()
        
        icon = search_btn.locator("svg.lucide-search")
        shortcut = search_btn.locator("div.font-mono")
        text = search_btn.locator("span.truncate")

        icon_box = await icon.bounding_box()
        shortcut_box = await shortcut.bounding_box()
        text_box = await text.bounding_box()

        print(f"Audit TopBar: Icon={icon_box}, Shortcut={shortcut_box}, Text={text_box}")
        
        if text_box and shortcut_box:
            if text_box['x'] + text_box['width'] > shortcut_box['x']:
                print(f"FAILURE: Overlap detected! Text right edge ({text_box['x'] + text_box['width']}) > Shortcut left edge ({shortcut_box['x']})")
            else:
                print("SUCCESS: TopBar Search text is clear of shortcut box.")
        
        await page.screenshot(path=str(SCREENSHOTS / "audit_topbar_success.png"))

        # Step 3: Check Switch thumb centering
        await page.goto("http://localhost:8080/cai-dat/he-thong", wait_until="networkidle")
        switch = page.locator("button[role='switch']").first
        if await switch.count() > 0:
            await switch.scroll_into_view_if_needed()
            thumb = switch.locator("span")
            switch_box = await switch.bounding_box()
            thumb_box = await thumb.bounding_box()
            
            # Check vertical alignment
            switch_center_y = switch_box['y'] + switch_box['height'] / 2
            thumb_center_y = thumb_box['y'] + thumb_box['height'] / 2
            diff = abs(switch_center_y - thumb_center_y)
            if diff < 1:
                print(f"SUCCESS: Switch thumb is vertically centered (diff={diff}px).")
            else:
                print(f"FAILURE: Switch thumb is NOT vertically centered (diff={diff}px).")
            
            await switch.screenshot(path=str(SCREENSHOTS / "audit_switch.png"))

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
