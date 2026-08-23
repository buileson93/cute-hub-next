import asyncio
import os
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS = Path("/tmp/browser/catalog_layout_check")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

async def check_layout(page, route_name, url, viewport_name):
    print(f"[{viewport_name}] Checking {route_name}: {url}")
    try:
        # Tăng timeout và chờ đến khi mạng rảnh để chắc chắn data & UI đã render
        await page.goto(url, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)
    except Exception as e:
        print(f"  [ERROR] Navigation failed: {e}")
        return

    # Debug: In ra toàn bộ text content của body để xem đang ở trang nào
    content = await page.text_content('body')
    if "đăng nhập" in content.lower() or "login" in content.lower() or "email" in content.lower():
        print(f"  [WARN] Page seems to be showing LOGIN screen instead of {route_name}")

    # 1. PageFrame check
    # Tìm div có class overflow-hidden và h-dvh (hoặc h-screen)
    frame = page.locator('div.h-dvh.overflow-hidden, div.h-screen.overflow-hidden').first
    if await frame.count() > 0:
        print(f"  [PASS] PageFrame found")
    else:
        print(f"  [FAIL] PageFrame NOT found")

    # 2. PageHeader check
    header = page.locator('.astryx-page-header, [data-component="PageHeader"]').first
    if await header.count() > 0:
        box = await header.bounding_box()
        print(f"  [PASS] PageHeader found at y={box['y'] if box else 'unknown'}")
    else:
        print(f"  [FAIL] PageHeader NOT found")

    # 3. PageBody check
    body = page.locator('.astryx-page-body, [role="main"]').first
    if await body.count() > 0:
        tab_index = await body.get_attribute("tabindex")
        print(f"  [PASS] PageBody found with tabindex={tab_index}")
    else:
        print(f"  [FAIL] PageBody NOT found")

    await page.screenshot(path=str(SCREENSHOTS / f"{viewport_name}_{route_name}.png"))

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        
        # Mở Dashboard trước để xác nhận trạng thái auth
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        
        await page.goto("http://localhost:8080")
        await page.wait_for_timeout(2000)
        
        # Thử kiểm tra các trang danh mục
        await check_layout(page, "ViTri", "http://localhost:8080/danh-muc/vi-tri", "Desktop")
        await check_layout(page, "DacTinh", "http://localhost:8080/danh-muc/dac-tinh", "Desktop")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
