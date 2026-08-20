import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/ui_audit/overflow")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def check_overflow(page, url):
    await page.goto(url, wait_until="networkidle")
    await page.wait_for_timeout(2000) # Wait for animations/dynamic content
    
    scroll_width = await page.evaluate("document.documentElement.scrollWidth")
    client_width = await page.evaluate("document.documentElement.clientWidth")
    
    if scroll_width > client_width:
        filename = url.replace("http://localhost:8080/", "").replace("/", "_") or "index"
        await page.screenshot(path=str(SCREENSHOTS / f"overflow_{filename}.png"))
        return False, scroll_width, client_width
    return True, scroll_width, client_width

async def main():
    # Extract G1 routes from markdown
    phan_hang_path = Path("docs/ui/phan-hang-mobile.md")
    g1_routes = []
    if phan_hang_path.exists():
        content = phan_hang_path.read_text()
        for line in content.split("\n"):
            if "**G1**" in line:
                import re
                match = re.search(r"`([^`]+)`", line)
                if match:
                    route = match.group(1).replace(".tsx", "").replace("_app.", "").replace(".", "/")
                    if route == "index": route = ""
                    # Filter out routes with dynamic params for this basic check
                    if "$" not in route:
                        g1_routes.append(f"http://localhost:8080/{route}")

    results = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await context.new_page()

        # Auth injection
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        if storage_key and session_json:
            await page.goto("http://localhost:8080")
            await page.evaluate(f"window.localStorage.setItem('{storage_key}', '{session_json}')")

        for url in g1_routes:
            print(f"Checking {url}...")
            is_ok, sw, cw = await check_overflow(page, url)
            if not is_ok:
                results.append(f"FAILED: {url} (scrollWidth: {sw}, clientWidth: {cw})")
            else:
                results.append(f"PASSED: {url}")

        await browser.close()

    for r in results:
        print(r)
    
    if any("FAILED" in r for r in results):
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())
