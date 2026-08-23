import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/table_actions")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Login
        await page.goto("http://localhost:8080/auth")
        await page.fill('input[type="email"]', "buileson93@gmail.com")
        await page.fill('input[type="password"]', "12345")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/tong-quan")
        print("Logged in successfully")

        # Navigate to /he-thong/thanh-phan (a page known to have a table)
        await page.goto("http://localhost:8080/he-thong/thanh-phan")
        await page.wait_for_selector(".mirats-standard-table-element")
        await page.screenshot(path=str(SCREENSHOTS / "1_table_loaded.png"))
        print("Table loaded")

        # Test Shift-click selection
        rows = page.locator("tr.astryx-table-row")
        row_count = await rows.count()
        if row_count >= 3:
            # Click first row
            await rows.nth(0).click()
            # Shift-click third row
            await page.keyboard.down("Shift")
            await rows.nth(2).click()
            await page.keyboard.up("Shift")
            
            await page.screenshot(path=str(SCREENSHOTS / "2_shift_selected.png"))
            print("Shift-click performed")

        # Check Export Dialog
        export_btn = page.get_by_role("button", name="Xuất dữ liệu ra file CSV")
        if await export_btn.is_visible():
            await export_btn.click()
            await page.wait_for_selector("text=Xuất dữ liệu ra CSV")
            
            # Check for "Lưu cấu hình cột"
            save_config_label = page.locator("label:has-text('Lưu cấu hình cột cho lần sau')")
            if await save_config_label.is_visible():
                print("Save config checkbox is visible")
                await save_config_label.click()
            
            await page.screenshot(path=str(SCREENSHOTS / "3_export_dialog.png"))
            await page.keyboard.press("Escape")

        # Check Bulk Delete Undo (Visual only if we don't want to actually delete data)
        # We can trigger the delete flow and then immediately undo
        delete_btn = page.get_by_role("button", name="Xóa hàng loạt")
        if await delete_btn.is_visible():
            await delete_btn.click()
            # Wait for confirmation dialog
            await page.wait_for_selector("text=Xác nhận xóa")
            await page.get_by_role("button", name="Xác nhận xóa").click()
            
            # Look for Undo toast
            await page.wait_for_selector("text=Hoàn tác")
            await page.screenshot(path=str(SCREENSHOTS / "4_undo_toast.png"))
            print("Undo toast visible")
            
            await page.get_by_role("button", name="Hoàn tác").click()
            await page.wait_for_selector("text=Đã hoàn tác")
            print("Undo clicked successfully")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
