import asyncio
import os
import json
import time
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/performance")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        
        # Restore Supabase session
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")

        if cookies_json:
            cookies = json.loads(cookies_json)
            for c in cookies:
                c["url"] = "http://localhost:8080"
            await context.add_cookies(cookies)

        page = await context.new_page()
        await page.goto("http://localhost:8080")
        
        if storage_key and session_json:
            await page.evaluate(
                f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
            )

        print("Navigating to /he-thong/thanh-phan...")
        await page.goto("http://localhost:8080/he-thong/thanh-phan", wait_until="networkidle")
        
        # Chờ bảng load
        try:
            table_container = page.locator(".mirats-data-table-core")
            await table_container.wait_for(state="visible", timeout=10000)
        except Exception as e:
            print(f"Bảng không hiển thị hoặc timeout: {e}")
            await page.screenshot(path=str(SCREENSHOTS / "error_no_table.png"))
            await browser.close()
            return

        # Lấy bounding box
        rect = await table_container.bounding_box()
        print(f"Table viewport rect: {rect}")
        
        # Kiểm tra scrollWidth vs clientWidth
        scroll_info = await table_container.evaluate("(el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflowX: getComputedStyle(el).overflowX })")
        print(f"Scroll info: {scroll_info}")
        
        if scroll_info['scrollWidth'] > scroll_info['clientWidth']:
            print("Table is horizontally scrollable.")
        else:
            print("WARNING: Table is NOT horizontally scrollable (scrollWidth <= clientWidth).")

        # Test cuộn vô tận
        print("Scrolling down to trigger infinite scroll...")
        for i in range(3):
            await page.mouse.wheel(0, 3000)
            await asyncio.sleep(1)
            await page.screenshot(path=str(SCREENSHOTS / f"scroll_{i}.png"))
        
        print("Finished sequence.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
