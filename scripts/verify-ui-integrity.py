import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/ui-audit/screenshots")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Just Audit public /auth page for Input size parity and Button styles
        await page.goto("http://localhost:8080/auth", wait_until="networkidle")
        
        email_input = page.locator("input[id='email']")
        password_input = page.locator("input[id='password']")
        submit_btn = page.locator("button[type='submit']")

        email_box = await email_input.bounding_box()
        submit_btn_box = await submit_btn.bounding_box()

        print(f"Email Input Height: {email_box['height']}px")
        print(f"Submit Button Height: {submit_btn_box['height']}px")

        # Check font sizes
        email_font = await email_input.evaluate("el => window.getComputedStyle(el).fontSize")
        submit_font = await submit_btn.evaluate("el => window.getComputedStyle(el).fontSize")
        
        print(f"Email Font Size: {email_font}")
        print(f"Submit Font Size: {submit_font}")

        # Check Switch logic in skins CSS (it applies globally)
        # We can't easily audit Switch without login, but we can verify TopBar visually if we find a way.
        # Let's at least check the auth page for no horizontal overflow.
        overflow = await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        print(f"Auth Page Horizontal Overflow: {overflow}")

        await page.screenshot(path=str(SCREENSHOTS / "audit_auth_page.png"))
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
