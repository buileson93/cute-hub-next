import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Giả lập auth nếu có
        auth_status = os.environ.get("LOVABLE_BROWSER_AUTH_STATUS")
        if auth_status == "injected":
            storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
            session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
            if storage_key and session_json:
                await page.goto("http://localhost:8080")
                await page.evaluate(f"window.localStorage.setItem('{storage_key}', '{session_json}')")

        print("--- Testing Table Integrity & Pagination ---")
        
        # 1. Kiểm tra trang Thành phần
        await page.goto("http://localhost:8080/he-thong/thanh-phan", wait_until="networkidle")
        print(f"Đã mở trang: {page.url}")
        
        # Kiểm tra sự tồn tại của bảng
        table = page.locator(".astryx-table")
        await table.wait_for(state="visible", timeout=10000)
        
        initial_count_text = await page.locator("text=/Đã tải \\d+ /").inner_text()
        print(f"Trạng thái ban đầu: {initial_count_text}")

        # 2. Kiểm tra Selection (Select All)
        select_all_checkbox = page.locator("thead input[type='checkbox'], thead button[role='checkbox']").first
        await select_all_checkbox.click()
        print("Đã click Select All")
        
        bulk_bar = page.locator("text=/Đã chọn \\d+ dòng/")
        await bulk_bar.wait_for(state="visible", timeout=5000)
        print(f"Hiển thị thanh tác vụ hàng loạt: {await bulk_bar.inner_text()}")

        # 3. Kiểm tra Pagination (Infinite Scroll)
        # Cuộn xuống cuối container bảng
        scroll_container = page.locator(".mirats-table-scroll-container")
        
        current_rows = await page.locator(".astryx-table-row").count()
        print(f"Số dòng hiện tại: {current_rows}")
        
        # Thử cuộn để trigger load thêm
        for i in range(3):
            await scroll_container.evaluate("el => el.scrollTop = el.scrollHeight")
            await page.wait_for_timeout(2000)
            new_count = await page.locator(".astryx-table-row").count()
            print(f"Lần cuộn {i+1}: Số dòng = {new_count}")
            if new_count > current_rows:
                print("Pagination hoạt động: Đã tải thêm dòng.")
                current_rows = new_count
            else:
                print("Không tải thêm dòng mới hoặc đã hết dữ liệu.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
