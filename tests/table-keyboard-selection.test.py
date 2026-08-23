import asyncio
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
        
        await page.wait_for_url("**/tong-quan", timeout=10000)
        
        # Go to inventory
        print("Navigating to inventory...")
        await page.goto("http://localhost:8080/he-thong/thanh-phan", wait_until="networkidle")
        
        # Wait for table
        table = page.locator(".astryx-table-row")
        await table.first.wait_for(state="visible")
        
        # Test shift selection
        print("Testing Shift selection...")
        # 1. Click first row
        rows = page.locator(".astryx-table-row")
        await rows.nth(0).click()
        await page.wait_for_timeout(500)
        
        # 2. Shift-click 5th row
        await rows.nth(4).click(modifiers=["Shift"])
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(SCREENSHOTS / "selection_shift.png"))
        
        # Check bulk action bar
        selected_text = page.locator("text=/Đã chọn 5/")
        if await selected_text.is_visible():
            print("SUCCESS: 5 rows selected via Shift-click.")
        else:
            print(f"FAILURE: Expected 5 rows selected.")
            # Debug info
            content = await page.content()
            if "Đã chọn" in content:
                print(f"Found other selection text: {page.locator('text=/Đã chọn/').first.inner_text()}")

        # Test space bar toggle
        print("Testing Space bar toggle...")
        await page.keyboard.press("ArrowDown")
        await page.keyboard.press(" ")
        await page.wait_for_timeout(500)
        
        # Test CSV export trigger
        print("Checking CSV export dialog...")
        export_btn = page.get_by_role("button", name="Xuất dữ liệu ra file CSV")
        await export_btn.click()
        await page.wait_for_selector("text=Xuất dữ liệu ra CSV")
        await page.screenshot(path=str(SCREENSHOTS / "csv_dialog.png"))
        print("SUCCESS: CSV Export dialog visible.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
