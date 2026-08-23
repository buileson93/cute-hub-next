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
        await page.screenshot(path=str(SCREENSHOTS / "0_auth_page.png"))
        
        print("Filling credentials...")
        await page.fill('input[type="email"]', "buileson93@gmail.com")
        await page.fill('input[type="password"]', "12345")
        await page.screenshot(path=str(SCREENSHOTS / "0b_credentials_filled.png"))
        
        print("Clicking submit...")
        await page.click('button[type="submit"]')
        
        # Wait for some indication of success or error
        try:
            await page.wait_for_url("**/tong-quan", timeout=10000)
            print(f"Login successful, navigated to: {page.url}")
        except Exception as e:
            print(f"Navigation to dashboard failed: {e}")
            await page.screenshot(path=str(SCREENSHOTS / "error_login_failed.png"))
            # Check for error messages
            error_msg = await page.content()
            if "Invalid login credentials" in error_msg:
                print("Observed 'Invalid login credentials' on page.")
            return

        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=str(SCREENSHOTS / "1_dashboard_loaded.png"))

        # Verify Header is sticky
        # PageHeader has data-testid="page-header"
        header = page.locator('[data-testid="page-header"]')
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

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
