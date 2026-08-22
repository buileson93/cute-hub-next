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
        # Use a realistic User-Agent and viewport
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        # Restore session from env if available (injected)
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")

        if cookies_json:
            cookies = json.loads(cookies_json)
            for c in cookies:
                c["url"] = "http://localhost:8080"
            await context.add_cookies(cookies)

        page = await context.new_page()
        
        # Bypass auth check if we have session
        await page.goto("http://localhost:8080")
        if storage_key and session_json:
            await page.evaluate(
                f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
            )

        print("Navigating to /he-thong/thanh-phan...")
        # Direct navigation might trigger redirect to /auth if session injection failed
        await page.goto("http://localhost:8080/he-thong/thanh-phan", wait_until="domcontentloaded")
        
        # Check if we are redirected to /auth
        if "/auth" in page.url:
            print(f"Redirected to auth! Current URL: {page.url}")
            # Try to login if we can find a test user button or similar, but for now just screenshot
            await page.screenshot(path=str(SCREENSHOTS / "auth_redirect.png"))
            # If we're stuck at auth, we can't test the table
            await browser.close()
            return

        # Wait for table
        try:
            # More specific locator for the optimized table
            table_container = page.locator(".mirats-data-table-core")
            await table_container.wait_for(state="visible", timeout=15000)
            print("Table is visible.")
        except Exception as e:
            print(f"Table not found: {e}")
            await page.screenshot(path=str(SCREENSHOTS / "no_table_after_nav.png"))
            await browser.close()
            return

        # Measure FPS during scroll
        print("Starting performance measurement...")
        await page.evaluate("""
            window.fpsData = [];
            let lastTime = performance.now();
            function checkFPS() {
                const now = performance.now();
                const delta = now - lastTime;
                window.fpsData.push(1000 / delta);
                lastTime = now;
                requestAnimationFrame(checkFPS);
            }
            requestAnimationFrame(checkFPS);
        """)

        # Scroll multiple times
        for i in range(5):
            await page.mouse.wheel(0, 2000)
            await asyncio.sleep(0.5)
            await page.screenshot(path=str(SCREENSHOTS / f"scroll_perf_{i}.png"))
        
        perf_results = await page.evaluate("window.fpsData")
        if perf_results:
            avg_fps = sum(perf_results) / len(perf_results)
            min_fps = min(perf_results)
            print(f"Performance Results: Avg FPS: {avg_fps:.2f}, Min FPS: {min_fps:.2f}")
        
        # Check horizontal scroll visibility
        scroll_info = await page.evaluate("""() => {
            const el = document.querySelector('.mirats-data-table-core');
            return {
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
                overflowX: getComputedStyle(el).overflowX,
                hasVisibleScrollbar: el.offsetHeight > el.clientHeight
            };
        }""")
        print(f"Geometry Info: {scroll_info}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
