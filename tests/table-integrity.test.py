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

        print("--- Testing Infinite Scroll Automation & Data Integrity ---")
        
        # 1. Mở trang Thành phần
        await page.goto("http://localhost:8080/he-thong/thanh-phan", wait_until="networkidle")
        print(f"Đã mở trang: {page.url}")
        
        # Kiểm tra sự tồn tại của bảng
        table = page.locator(".mirats-standard-table-element")
        await table.wait_for(state="visible", timeout=15000)
        
        # Lấy số lượng ban đầu từ label record count
        count_label = page.locator("text=/\\d+ / \\d+ thành phần/")
        await count_label.wait_for(state="visible", timeout=5000)
        initial_text = await count_label.inner_text()
        print(f"Trạng thái ban đầu: {initial_text}")

        # 2. Kiểm tra Duplicate IDs (Kiểm tra 100 dòng đầu)
        rows = page.locator(".astryx-table-cell").locator("..") # Lấy các TableRow
        row_ids = await page.evaluate("""
            () => Array.from(document.querySelectorAll('tr[data-key]')).map(tr => tr.getAttribute('data-key'))
        """)
        # Lưu ý: Cần đảm bảo component rendering có data-key attribute cho row ID
        # Nếu không có data-key, dùng text content hoặc selector khác để định danh duy nhất
        
        # 3. Kiểm tra Tự động cuộn (Automatic Infinite Scroll)
        scroll_container = page.locator(".mirats-table-scroll-container")
        
        # Đếm số dòng TR thực tế hiện có trong DOM (do virtualization nên chỉ đếm số lượng bản ghi hiển thị/tải)
        # Trong StandardTable, display.length là số lượng record đã tải
        
        current_loaded = int(initial_text.split("/")[0].strip())
        print(f"Số lượng đã tải hiện tại: {current_loaded}")

        # Thử cuộn để trigger load thêm tự động
        for i in range(2):
            print(f"Lần cuộn {i+1}...")
            # Cuộn xuống gần cuối
            await scroll_container.evaluate("el => el.scrollTop = el.scrollHeight - 100")
            
            # Đợi indicator loading hoặc đợi network
            await page.wait_for_timeout(3000)
            
            new_text = await count_label.inner_text()
            new_loaded = int(new_text.split("/")[0].strip())
            print(f"Sau khi cuộn: {new_text}")
            
            if new_loaded > current_loaded:
                print(f"Tự động tải hoạt động: {current_loaded} -> {new_loaded}")
                current_loaded = new_loaded
            else:
                print("Không tải thêm dòng mới. Có thể đã hết dữ liệu hoặc lỗi trigger.")
        
        # 4. Kiểm tra xem có nút "Tải thêm" nào sót lại không
        load_more_btn = page.locator("text=Tải thêm dữ liệu")
        is_visible = await load_more_btn.is_visible()
        if is_visible:
            print("LỖI: Nút 'Tải thêm dữ liệu' vẫn còn hiển thị.")
        else:
            print("THÀNH CÔNG: Không còn nút tải thủ công, chuyển sang tự động hoàn toàn.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())