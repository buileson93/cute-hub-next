import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/dashboard-integrity")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    {"name": "desktop", "width": 1280, "height": 800},
    {"name": "tablet", "width": 768, "height": 1024},
    {"name": "mobile", "width": 375, "height": 667}
]

async def run_test_for_viewport(playwright, viewport):
    name = viewport["name"]
    print(f"\n--- Testing Viewport: {name} ({viewport['width']}x{viewport['height']}) ---")
    
    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context(viewport={"width": viewport["width"], "height": viewport["height"]})
    page = await context.new_page()

    try:
        # Login
        await page.goto("http://localhost:8080/auth", wait_until="networkidle")
        await page.fill('input[type="email"]', "buileson93@gmail.com")
        await page.fill('input[type="password"]', "12345")
        await page.click('button[type="submit"]')
        
        await page.wait_for_url("**/tong-quan", timeout=10000)
        await page.wait_for_load_state("networkidle")
        
        # Verify Header is fixed
        header = page.locator('[data-testid="page-header"]')
        await header.wait_for(state="visible")
        header_box = await header.bounding_box()
        print(f"[{name}] Header initial Y: {header_box['y']}")

        # Verify HeartBeatStrip is also fixed (or at least doesn't move relative to header)
        heartbeat = page.locator('div:has-text("HEARTBEAT")').first # Adjust selector if needed
        hb_box = None
        if await heartbeat.is_visible():
            hb_box = await heartbeat.bounding_box()
            print(f"[{name}] HeartBeat initial Y: {hb_box['y']}")

        # Scroll the content
        scrollable = page.locator(".mirats-scroll")
        if await scrollable.count() > 0:
            # Force content to be scrollable if it's too short for the test
            await scrollable.evaluate("el => el.style.minHeight = '2000px'")
            
            # Scroll down
            await scrollable.evaluate("el => el.scrollTop = 500")
            await page.wait_for_timeout(1000)
            
            await page.screenshot(path=str(SCREENSHOTS / f"{name}_scrolled.png"))
            
            # Verify Header didn't move
            header_box_after = await header.bounding_box()
            print(f"[{name}] Header Y after scroll: {header_box_after['y']}")
            
            if abs(header_box['y'] - header_box_after['y']) < 2:
                print(f"[{name}] SUCCESS: Header remained fixed.")
            else:
                print(f"[{name}] FAILURE: Header moved from {header_box['y']} to {header_box_after['y']}")

            if hb_box:
                hb_box_after = await heartbeat.bounding_box()
                if abs(hb_box['y'] - hb_box_after['y']) < 2:
                    print(f"[{name}] SUCCESS: HeartBeat remained fixed.")
                else:
                    print(f"[{name}] FAILURE: HeartBeat moved.")
        else:
            print(f"[{name}] FAILURE: .mirats-scroll not found")

    except Exception as e:
        print(f"[{name}] ERROR: {str(e)}")
    finally:
        await browser.close()

async def main():
    async with async_playwright() as playwright:
        for vp in VIEWPORTS:
            await run_test_for_viewport(playwright, vp)

if __name__ == "__main__":
    asyncio.run(main())
