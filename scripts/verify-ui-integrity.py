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

        # Step 1: Login
        await page.goto("http://localhost:8080/auth", wait_until="networkidle")
        await page.fill("input[id='email']", "buileson93@gmail.com")
        await page.fill("input[id='password']", "12345678")
        await page.click("button[type='submit']")
        
        # Wait for navigation
        try:
            await page.wait_for_selector("[data-testid='page-header']", timeout=15000)
            print("Login successful")
        except:
            print("Login failed or timed out")
            await page.screenshot(path=str(SCREENSHOTS / "final_audit_login_failed.png"))
            await browser.close()
            return

        # Step 2: Audit TopBar Search
        search_btn = page.locator("div[data-tour='search'] button")
        await search_btn.scroll_into_view_if_needed()
        
        btn_box = await search_btn.bounding_box()
        icon = search_btn.locator("svg.lucide-search")
        icon_box = await icon.bounding_box()
        shortcut = search_btn.locator("div.font-mono")
        shortcut_box = await shortcut.bounding_box()
        text = search_btn.locator("span.truncate")
        text_box = await text.bounding_box()

        print(f"Audit TopBar: Icon={icon_box}, Shortcut={shortcut_box}, Text={text_box}")
        
        # Check for overlap
        if text_box and shortcut_box:
            if text_box['x'] + text_box['width'] > shortcut_box['x']:
                print(f"FAILURE: Overlap detected! Text right edge ({text_box['x'] + text_box['width']}) > Shortcut left edge ({shortcut_box['x']})")
            else:
                print("SUCCESS: TopBar Search text is clear of shortcut box.")
        
        # Step 3: Check for Horizontal Overflow
        overflow = await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        if overflow:
            print("FAILURE: Horizontal overflow detected at root level!")
        else:
            print("SUCCESS: No horizontal overflow detected at 1280px.")

        await page.screenshot(path=str(SCREENSHOTS / "final_audit_desktop.png"))

        # Step 4: Mobile Audit (390px)
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(2000)
        overflow_mobile = await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        if overflow_mobile:
             print("FAILURE: Horizontal overflow detected on Mobile (390px)!")
        else:
             print("SUCCESS: No horizontal overflow on Mobile.")
        
        await page.screenshot(path=str(SCREENSHOTS / "final_audit_mobile.png"))

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
