import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
import json
import os

SCREENSHOTS = Path("/tmp/browser/performance/screenshots")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})

        # Restore Supabase session from env if available
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")

        if cookies_json:
            cookies = json.loads(cookies_json)
            for c in cookies:
                c["url"] = "http://localhost:8080"
            await context.add_cookies(cookies)

        page = await context.new_page()

        # Step 1: Login & Navigation
        await page.goto("http://localhost:8080")
        if storage_key and session_json:
            await page.evaluate(
                f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
            )

        print("Navigating to /he-thong/thanh-phan...")
        await page.goto("http://localhost:8080/he-thong/thanh-phan", wait_until="networkidle")
        await page.screenshot(path=str(SCREENSHOTS / "1_initial_load.png"))
        
        # Step 2: Verify Column Visibility Button
        print("Checking Column Visibility menu...")
        col_btn = page.get_by_role("button", name="Cột hiển thị")
        await col_btn.wait_for(state="visible", timeout=5000)
        await col_btn.click()
        await page.screenshot(path=str(SCREENSHOTS / "2_column_menu_open.png"))
        
        # Close menu
        await page.keyboard.press("Escape")
        
        # Step 3: Verify View Mode Toggle
        print("Checking View Mode toggle...")
        asset_tab = page.get_by_role("button", name="Theo tài sản")
        await asset_tab.click()
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=str(SCREENSHOTS / "3_asset_view.png"))
        
        # Step 4: Verify Column Persistence
        print("Checking Column Visibility persistence...")
        await col_btn.click()
        # Toggle a column (e.g., "Serial")
        serial_item = page.get_by_role("menuitemcheckbox", name="Serial")
        await serial_item.click()
        await page.keyboard.press("Escape")
        
        # Switch back to component view
        comp_tab = page.get_by_role("button", name="Theo thành phần")
        await comp_tab.click()
        await page.wait_for_load_state("networkidle")
        
        # Check if Column Visibility still works
        await col_btn.click()
        await page.screenshot(path=str(SCREENSHOTS / "4_column_persistence_check.png"))
        
        # Step 5: Infinite Scroll Check
        print("Testing infinite scroll...")
        scroll_container = page.locator(".mirats-scroll").first
        await scroll_container.evaluate("el => el.scrollTop = el.scrollHeight")
        await asyncio.sleep(2) # Wait for potential fetch
        await page.screenshot(path=str(SCREENSHOTS / "5_scrolled_down.png"))

        await browser.close()
        print("Test complete. Screenshots saved to", SCREENSHOTS)

if __name__ == "__main__":
    asyncio.run(main())
