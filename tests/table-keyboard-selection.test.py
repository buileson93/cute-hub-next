import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/table-keyboard")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Login
        print("Logging in...")
        await page.goto("http://localhost:8080/auth", wait_until="networkidle")
        await page.fill('input[type="email"]', "buileson93@gmail.com")
        await page.fill('input[type="password"]', "12345")
        await page.click('button[type="submit"]')
        
        # Wait for redirect to / or /tong-quan
        await page.wait_for_timeout(2000)
        print(f"Logged in, current URL: {page.url}")
        
        # Go to inventory
        print("Navigating to inventory...")
        await page.goto("http://localhost:8080/he-thong/thanh-phan", wait_until="networkidle")
        
        # Wait for table
        table = page.locator(".astryx-table-row")
        await table.first.wait_for(state="visible", timeout=10000)
        
        # Test shift selection
        print("Testing Shift selection...")
        rows = page.locator(".astryx-table-row")
        
        # 1. Click first row checkbox wrapper
        checkboxes = page.locator("button[role='checkbox'][aria-label^='Chọn dòng']")
        await checkboxes.nth(0).click()
        await page.wait_for_timeout(500)
        
        # 2. Shift-click 5th row checkbox wrapper
        await checkboxes.nth(4).click(modifiers=["Shift"])
        await page.wait_for_timeout(1000)
        await page.screenshot(path=str(SCREENSHOTS / "selection_shift.png"))
        
        # Check bulk action bar - it should show "Đã chọn 5"
        content = await page.content()
        if "Đã chọn 5" in content:
            print("SUCCESS: 5 rows selected via Shift-click.")
        else:
            print("FAILURE: Expected 'Đã chọn 5' in UI.")
            # Print visible text related to selection
            sel_bar = page.locator("div:has-text('Đã chọn')").last
            if await sel_bar.is_visible():
                print(f"Current selection bar text: {await sel_bar.inner_text()}")

        # Test Space key selection
        print("Testing Space key selection...")
        await page.keyboard.press("ArrowDown")
        await page.keyboard.press("ArrowDown")
        await page.keyboard.press(" ")
        await page.wait_for_timeout(500)
        
        # Test Export trigger
        print("Checking Export Dialog...")
        export_btn = page.get_by_role("button", name="Xuất dữ liệu ra file CSV")
        if await export_btn.is_visible():
            await export_btn.click()
            await page.wait_for_selector("text=Xuất dữ liệu ra CSV", timeout=5000)
            print("SUCCESS: Export dialog opened.")
        else:
            print("FAILURE: Export button not found.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
