import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/dashboard-integrity")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Login
        await page.goto("http://localhost:8080/auth", wait_until="domcontentloaded")
        await page.fill('input[type="email"]', "buileson93@gmail.com")
        await page.fill('input[type="password"]', "12345")
        
        # Click login button - wait for navigation
        await asyncio.gather(
            page.wait_for_url("**/tong-quan", timeout=15000),
            page.click('button[type="submit"]')
        )
        
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=str(SCREENSHOTS / "1_dashboard_loaded.png"))
        print(f"Opened dashboard: {page.url}")

        # Verify Header is sticky
        header = page.get_by_test_id("page-header")
        await header.wait_for(state="visible")
        header_box = await header.bounding_box()
        print(f"Header initial Y: {header_box['y']}")

        # Scroll the specific container
        scrollable = page.locator(".mirats-scroll")
        await scrollable.evaluate("el => el.scrollTop = 500")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=str(SCREENSHOTS / "2_dashboard_scrolled.png"))

        header_box_after = await header.bounding_box()
        print(f"Header Y after scroll: {header_box_after['y']}")

        if abs(header_box['y'] - header_box_after['y']) < 5:
            print("SUCCESS: Header is sticky/fixed during scroll.")
        else:
            print("FAILURE: Header moved during scroll.")

        # Check if dashboard grid content is visible
        grid = page.locator(".astryx-dashboard-grid") # Check class in DashboardGrid if possible
        grid_visible = await scrollable.is_visible()
        print(f"Dashboard scrollable area visible: {grid_visible}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
