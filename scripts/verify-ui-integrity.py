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

        print("Starting UI Integrity Check...")

        # Login process
        await page.goto("http://localhost:8080/auth")
        await page.fill('input[id="email"]', "buileson93@gmail.com")
        await page.fill('input[id="password"]', "12345")
        await page.click('button[type="submit"]')
        
        # Wait for potential redirect or toast
        await page.wait_for_timeout(3000)
        print(f"Post-login URL: {page.url}")

        # Navigate to su-co page where we added buttons
        await page.goto("http://localhost:8080/su-co")
        await page.wait_for_load_state("networkidle")
        print(f"Navigated to: {page.url}")

        # 1. Check TopBar Search Overlap
        search_btn = page.locator('[data-tour="search"] button')
        if await search_btn.count() > 0:
            s_btn = search_btn.first
            await s_btn.screenshot(path="/tmp/browser/search_overlap_fix.png")
            
            icon = s_btn.locator('svg').first
            text = s_btn.locator('span').first
            
            if await icon.count() > 0 and await text.count() > 0:
                ibox = await icon.bounding_box()
                tbox = await text.bounding_box()
                print(f"Search Icon box: {ibox}")
                print(f"Search Text box: {tbox}")
                
                if tbox['x'] < ibox['x'] + ibox['width']:
                    print("❌ FAIL: Search icon STILL overlaps text!")
                else:
                    print("✅ PASS: Search icon and text are correctly separated.")

        # 2. Check "KHÔI PHỤC" and "CÁ NHÂN HÓA" buttons
        btns = ["KHÔI PHỤC", "CÁ NHÂN HÓA", "BÁO CÁO MỚI"]
        for label in btns:
            btn = page.locator(f'button:has-text("{label}")')
            if await btn.count() > 0:
                b = btn.first
                await b.screenshot(path=f"/tmp/browser/btn_{label.replace(' ', '_')}.png")
                print(f"Captured screenshot for button: {label}")
            else:
                print(f"Could not find button with label: {label}")

        await browser.close()

if __name__ == "__main__":
    os.makedirs("/tmp/browser", exist_ok=True)
    asyncio.run(verify_ui_integrity())
