import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

# Setup for session injection if available
STORAGE_KEY = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
SESSION_JSON = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
COOKIES_JSON = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")

SCREENSHOTS = Path("/tmp/browser/audit-undo")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Restore session
        if COOKIES_JSON:
            cookies = json.loads(COOKIES_JSON)
            for c in cookies:
                c["url"] = "http://localhost:8080"
            await context.add_cookies(cookies)

        await page.goto("http://localhost:8080")
        if STORAGE_KEY and SESSION_JSON:
            await page.evaluate(
                f"window.localStorage.setItem({json.dumps(STORAGE_KEY)}, {json.dumps(SESSION_JSON)})"
            )
        
        # 1. Test Navigation to Audit Log
        print("Navigating to Audit Log...")
        await page.goto("http://localhost:8080/admin/audit")
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=str(SCREENSHOTS / "01_audit_log_page.png"))
        
        # Check if page loaded
        h1 = await page.get_by_role("heading", name="Nhật ký hệ thống").is_visible()
        print(f"Audit Log Page visible: {h1}")

        # 2. Test Persistent Undo (Simulated)
        # We'll go to a table, trigger a delete, refresh, and check if undo toast persists
        print("Navigating to Devices to test Undo...")
        await page.goto("http://localhost:8080/thiet-bi")
        await page.wait_for_load_state("networkidle")
        
        # Select first row if exists
        rows = page.locator(".astryx-table-row")
        if await rows.count() > 0:
            print("Selecting first row for deletion...")
            await page.locator("button[role='checkbox']").first.click()
            await page.screenshot(path=str(SCREENSHOTS / "02_row_selected.png"))
            
            # Click Bulk Delete
            delete_btn = page.get_by_role("button", name="Xóa")
            if await delete_btn.is_visible():
                await delete_btn.click()
                print("Delete clicked, waiting for confirm...")
                
                # In our StandardTable, bulkDelete triggers a confirm dialog first
                confirm_btn = page.get_by_role("button", name="Xác nhận xóa")
                if await confirm_btn.is_visible():
                    await confirm_btn.click()
                    print("Confirmed deletion, waiting for Undo toast...")
                    
                    # Wait for toast
                    await page.wait_for_selector("text=Hoàn tác")
                    await page.screenshot(path=str(SCREENSHOTS / "03_undo_toast_visible.png"))
                    
                    # REFRESH PAGE
                    print("Refreshing page to test persistent undo...")
                    await page.reload()
                    await page.wait_for_load_state("networkidle")
                    
                    # Check if toast reappears
                    undo_toast = page.get_by_role("button", name="Hoàn tác")
                    is_toast_back = await undo_toast.is_visible()
                    print(f"Undo toast persisted after refresh: {is_toast_back}")
                    await page.screenshot(path=str(SCREENSHOTS / "04_after_refresh.png"))
                    
                    if is_toast_back:
                        await undo_toast.click()
                        print("Undo clicked after refresh!")
                        await page.wait_for_selector("text=Đã hoàn tác")
                        await page.screenshot(path=str(SCREENSHOTS / "05_undo_success.png"))
        else:
            print("No rows found to test deletion.")

        # 3. Test Audit Log Entry
        print("Returning to Audit Log to verify entries...")
        await page.goto("http://localhost:8080/admin/audit")
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=str(SCREENSHOTS / "06_audit_log_updated.png"))
        
        await browser.close()

asyncio.run(main())
