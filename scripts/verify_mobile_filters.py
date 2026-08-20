import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
import os

SCREENSHOTS = Path("/tmp/browser/ui_audit/screenshots")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        # Mobile viewport
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()

        # Auth injection if available
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        if storage_key and session_json:
            await page.goto("http://localhost:8080")
            await page.evaluate(
                f"window.localStorage.setItem('{storage_key}', '{session_json}')"
            )

        await page.goto("http://localhost:8080/su-co", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        
        # 1. Measure initial toolbar height
        toolbar = page.locator(".flex.flex-wrap.items-center.gap-x-4.gap-y-1.rounded-lg.border")
        box = await toolbar.bounding_box()
        print(f"Initial toolbar height: {box['height']}px")
        await page.screenshot(path=str(SCREENSHOTS / "1_mobile_initial.png"))

        # 2. Click "Bộ lọc" button
        filter_btn = page.get_by_role("button", name="Bộ lọc")
        await filter_btn.click()
        await page.wait_for_timeout(1000)
        await page.screenshot(path=str(SCREENSHOTS / "2_filter_sheet_open.png"))

        # 3. Apply a filter (e.g., Search)
        search_input = page.get_by_placeholder("Nhập nội dung tìm...")
        await search_input.fill("SC-001")
        await page.get_by_role("button", name="Áp dụng").click()
        await page.wait_for_timeout(1000)
        
        # Verify button badge
        badge = filter_btn.locator(".badge") # Check if badge appears
        print(f"Filter badge exists: {await filter_btn.inner_text()}")
        await page.screenshot(path=str(SCREENSHOTS / "3_filter_applied.png"))

        # 4. Desktop check
        desktop_context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        d_page = await desktop_context.new_page()
        if storage_key and session_json:
            await d_page.goto("http://localhost:8080")
            await d_page.evaluate(
                f"window.localStorage.setItem('{storage_key}', '{session_json}')"
            )
        await d_page.goto("http://localhost:8080/su-co", wait_until="networkidle")
        await d_page.wait_for_timeout(2000)
        await d_page.screenshot(path=str(SCREENSHOTS / "4_desktop_view.png"))
        
        print("Verification complete.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
