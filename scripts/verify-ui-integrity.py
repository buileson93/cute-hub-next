import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

async def verify_ui_integrity():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # Login process
        await page.goto("http://localhost:8080/auth")
        await page.fill('input[type="email"]', "buileson93@gmail.com")
        await page.fill('input[type="password"]', "12345")
        await page.click('button[type="submit"]')
        
        # Wait for navigation to dashboard
        await page.wait_for_url("**/", timeout=10000)
        await page.wait_for_load_state("networkidle")

        print(f"Logged in successfully. Current URL: {page.url}")

        # Check TopBar Search Overlap
        search_btn = page.locator('[data-tour="search"] button')
        if await search_btn.count() > 0:
            box = await search_btn.bounding_box()
            print(f"Search button box: {box}")
            
            # Screenshot for manual check
            await search_btn.screenshot(path="/tmp/browser/search_overlap_before.png")
            
            # Check for specific overlapping elements if possible
            icon = search_btn.locator('svg').first
            text = search_btn.locator('span').first
            shortcut = search_btn.locator('div.sm\\:flex').first
            
            if await icon.count() > 0 and await text.count() > 0:
                ibox = await icon.bounding_box()
                tbox = await text.bounding_box()
                print(f"Icon box: {ibox}")
                print(f"Text box: {tbox}")
                
                # If text x is less than icon x + width, they overlap
                if tbox['x'] < ibox['x'] + ibox['width']:
                    print("⚠️ DETECTED: Search icon overlaps text!")

        # Check other buttons (Personalization, etc.)
        # We'll look for buttons containing specific text
        kpi_btns = page.locator('button:has-text("CÁ NHÂN HÓA"), button:has-text("THÊM MẪU")')
        count = await kpi_btns.count()
        print(f"Found {count} targeted buttons for overlap check.")
        for i in range(count):
            btn = kpi_btns.nth(i)
            await btn.screenshot(path=f"/tmp/browser/btn_check_{i}.png")
            
        await browser.close()

if __name__ == "__main__":
    os.makedirs("/tmp/browser", exist_ok=True)
    asyncio.run(verify_ui_integrity())
