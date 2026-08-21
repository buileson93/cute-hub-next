import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

async def check_overlap(page, selector):
    elements = await page.query_selector_all(selector)
    boxes = []
    for el in elements:
        box = await el.bounding_box()
        if box:
            boxes.append(box)
    
    overlaps = []
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            b1 = boxes[i]
            b2 = boxes[j]
            # Check intersection
            if (b1['x'] < b2['x'] + b2['width'] and
                b1['x'] + b1['width'] > b2['x'] and
                b1['y'] < b2['y'] + b2['height'] and
                b1['y'] + b1['height'] > b2['y']):
                overlaps.append((i, j))
    return overlaps

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # Login - Using a more robust wait
        await page.goto("http://localhost:8080/auth")
        try:
            await page.fill("input[type='email']", "buileson93@gmail.com")
            await page.fill("input[type='password']", "123456")
            await page.click("button[type='submit']")
            # Wait for dashboard content instead of URL to avoid redirection loop issues
            await page.wait_for_selector("[data-testid='page-header']", timeout=10000)
        except Exception as e:
            print(f"Login or redirect failed, proceeding to check current page: {page.url}")

        
        # 1. TopBar Overlap Check
        print("Checking TopBar for overlaps...")
        topbar_overlaps = await check_overlap(page, "div.astryx-topbar button")
        if topbar_overlaps:
            print(f"FAILED: Found {len(topbar_overlaps)} overlaps in TopBar buttons")
        else:
            print("PASSED: No overlaps in TopBar buttons")

        # 2. Search Button Alignment
        search_btn = page.locator("button[aria-label='Mở tìm kiếm PowerSearch']")
        if await search_btn.is_visible():
            box = await search_btn.bounding_box()
            icon = page.locator("button[aria-label='Mở tìm kiếm PowerSearch'] svg.lucide-search")
            icon_box = await icon.bounding_box()
            if icon_box and box:
                # Icon should be inside button and left-aligned roughly
                if icon_box['x'] > box['x'] + 20:
                    print("FAILED: Search icon is not correctly left-aligned in TopBar search")
                else:
                    print("PASSED: Search icon alignment is correct")

        # 3. Horizontal Scroll Check
        scroll_width = await page.evaluate("document.body.scrollWidth")
        client_width = await page.evaluate("document.body.clientWidth")
        if scroll_width > client_width:
            print(f"FAILED: Horizontal scroll detected! ({scroll_width}px > {client_width}px)")
        else:
            print("PASSED: No horizontal scroll detected on dashboard")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
