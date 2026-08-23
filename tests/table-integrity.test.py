import asyncio
import os
import json
import time
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Phục hồi session
        session_file = os.path.expanduser("~/.cache/lovable-auth/session.json")
        if os.path.exists(session_file):
            with open(session_file) as f:
                minted = json.load(f)
            storage_key = minted["storage_key"]
            session_json = json.dumps(minted["session"])
            cookies = minted.get("cookies", [])
            for c in cookies:
                c["url"] = "http://localhost:8080"
            await context.add_cookies(cookies)
            await page.goto("http://localhost:8080")
            await page.evaluate(f"window.localStorage.setItem('{storage_key}', '{session_json}')")
        else:
            print("CẢNH BÁO: Không tìm thấy session minted.")

        print("--- Testing Phase 11I: Virtualization Performance & Data Integrity ---")
        
        await page.goto("http://localhost:8080/he-thong/thanh-phan", wait_until="networkidle")
        print(f"Đã mở trang: {page.url}")
        
        if "/auth" in page.url:
            print("KẾT QUẢ: Bị redirect về /auth.")
            await browser.close()
            return

        table = page.locator(".mirats-standard-table-element")
        await table.wait_for(state="visible", timeout=5000)
        
        scroll_container = page.locator(".mirats-table-scroll-container")
        
        # 1. Stress Test: Cuộn nhanh và đo lag (dropped frames)
        print("Đang chạy Stress Test cuộn nhanh...")
        
        # Script để đếm dropped frames hoặc đo FPS trong 5 giây
        fps_script = """
        () => {
            return new Promise(resolve => {
                let frameCount = 0;
                let startTime = performance.now();
                function check() {
                    frameCount++;
                    if (performance.now() - startTime < 3000) {
                        requestAnimationFrame(check);
                    } else {
                        resolve(frameCount / 3);
                    }
                }
                requestAnimationFrame(check);
            });
        }
        """
        
        # Bắt đầu đo FPS trong khi cuộn
        fps_task = asyncio.create_task(page.evaluate(fps_script))
        
        # Thực hiện cuộn liên tục
        for _ in range(15):
            await scroll_container.evaluate("el => el.scrollTop += 500")
            await page.wait_for_timeout(100)
            
        avg_fps = await fps_task
        print(f"FPS Trung bình khi cuộn nhanh: {avg_fps:.2f}")
        
        # 2. Kiểm tra tính toàn vẹn (Deduplication)
        row_ids = await page.evaluate("""
            () => Array.from(document.querySelectorAll('tr[data-key]')).map(tr => tr.getAttribute('data-key'))
        """)
        
        unique_ids = set(row_ids)
        if len(row_ids) != len(unique_ids):
            print(f"LỖI: Phát hiện {len(row_ids) - len(unique_ids)} dòng bị trùng lặp ID trong DOM.")
        else:
            print(f"THÀNH CÔNG: Không có ID trùng lặp (Tổng cộng {len(row_ids)} dòng trong view).")

        # 3. Kiểm tra Scroll Restoration
        current_offset = await scroll_container.evaluate("el => el.scrollTop")
        print(f"Vị trí cuộn hiện tại: {current_offset}")
        
        # Chuyển tab hoặc reload
        await page.reload(wait_until="networkidle")
        await table.wait_for(state="visible", timeout=5000)
        
        restored_offset = await scroll_container.evaluate("el => el.scrollTop")
        print(f"Vị trí cuộn sau khi reload: {restored_offset}")
        
        # 4. Kiểm tra Error State (Giả lập lỗi mạng bằng cách chặn fetch nếu cần, nhưng ở đây kiểm tra UI)
        # (Phần này khó test tự động nếu không mock API, bỏ qua hoặc test sự tồn tại của indicator)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())