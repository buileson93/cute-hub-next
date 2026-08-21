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

        # Bypass auth by navigating directly to su-co
        # We assume the dev server allows reading public parts or we just want to see the layout
        await page.goto("http://localhost:8080/su-co")
        await page.wait_for_load_state("domcontentloaded")
        print(f"URL: {page.url}")

        # Check for the search button in TopBar
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
                
                # In our new flex layout:
                # Icon is in a div with pl-3
                # Text is next to it
                if tbox and ibox and tbox['x'] < ibox['x'] + ibox['width']:
                    print("❌ FAIL: Search icon STILL overlaps text!")
                else:
                    print("✅ PASS: Search icon and text are correctly separated.")
        else:
            print("Search button not found (maybe redirected to /auth?)")
            # If redirected, we at least check /auth button heights
            if "/auth" in page.url:
                login_btn = page.locator('button:has-text("Đăng nhập")').first
                if await login_btn.count() > 0:
                    box = await login_btn.bounding_box()
                    print(f"Login button height: {box['height']}px")
                    await login_btn.screenshot(path="/tmp/browser/auth_login_btn.png")

        await browser.close()

if __name__ == "__main__":
    os.makedirs("/tmp/browser", exist_ok=True)
    asyncio.run(verify_ui_integrity())
