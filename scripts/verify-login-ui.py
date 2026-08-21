import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        print("Navigating to login page...")
        await page.goto("http://localhost:8080/auth")
        
        # Check input dimensions and alignment
        email_input = page.locator("input[type='email']")
        password_input = page.locator("input[type='password']")
        
        for name, locator in [("Email", email_input), ("Password", password_input)]:
            await locator.wait_for(state="visible")
            box = await locator.bounding_box()
            fs = await locator.evaluate("el => window.getComputedStyle(el).fontSize")
            h = await locator.evaluate("el => window.getComputedStyle(el).height")
            
            print(f"{name} Input: Box={box}, FontSize={fs}, Height={h}")
            
            # Verify height is around 56px (h-14)
            if float(h.replace('px', '')) < 50:
                print(f"FAILED: {name} input height is too small ({h})")
            
            # Take screenshot of focus state
            await locator.focus()
            await page.screenshot(path=f"/tmp/browser/ui-recovery/login_{name.lower()}_focus.png")
            print(f"Captured {name} focus state screenshot")

        # Check for horizontal overflow
        scroll_width = await page.evaluate("document.documentElement.scrollWidth")
        client_width = await page.evaluate("document.documentElement.clientWidth")
        if scroll_width > client_width:
            print(f"FAILED: Horizontal overflow detected! ({scroll_width} > {client_width})")
        else:
            print("PASSED: No horizontal overflow")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
