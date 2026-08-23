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
        print("Navigating to auth page...")
        await page.goto("http://localhost:8080/auth", wait_until="networkidle")
        
        print("Filling credentials...")
        await page.fill('input[type="email"]', "buileson93@gmail.com")
        await page.fill('input[type="password"]', "12345")
        
        print("Clicking submit...")
        await page.click('button[type="submit"]')
        
        # The app might redirect to / or /tong-quan depending on settings
        # We want to be on /tong-quan
        try:
            # Wait for navigation to complete to ANY page
            await page.wait_for_url("**/tong-quan", timeout=10000)
            print(f"Already on: {page.url}")
        except Exception:
            print(f"Current URL after login: {page.url}")
            if "/tong-quan" not in page.url:
                print("Navigating explicitly to /tong-quan...")
                await page.goto("http://localhost:8080/tong-quan", wait_until="networkidle")

        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=str(SCREENSHOTS / "1_dashboard_loaded.png"))
        print(f"Dashboard state verified at: {page.url}")

        # Verify Header is sticky
        # PageHeader has data-testid="page-header"
        header = page.locator('[data-testid="page-header"]')
        await header.wait_for(state="visible")
        header_box = await header.bounding_box()
        print(f"Header initial Y: {header_box['y']}")

        # Scroll the specific container
        scrollable = page.locator(".mirats-scroll")
        if await scrollable.count() > 0:
            print("Found .mirats-scroll container. Testing scroll...")
            # Ensure there is enough content to scroll
            await scrollable.evaluate("el => el.style.height = '500px'") # Mock height if needed or just use real content
            await scrollable.evaluate("el => el.scrollTop = 200")
            await page.wait_for_timeout(1000)
            await page.screenshot(path=str(SCREENSHOTS / "2_dashboard_scrolled.png"))

            header_box_after = await header.bounding_box()
            print(f"Header Y after scroll: {header_box_after['y']}")

            if abs(header_box['y'] - header_box_after['y']) < 5:
                print("SUCCESS: Header is sticky/fixed during scroll.")
            else:
                print("FAILURE: Header moved during scroll.")
        else:
            print("FAILURE: .mirats-scroll container not found!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
