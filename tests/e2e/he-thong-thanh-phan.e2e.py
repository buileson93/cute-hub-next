# E2E /he-thong/thanh-phan — thêm / sửa / xoá thành phần hệ thống và tài sản,
# đồng thời kiểm tra cây đơn vị trong danh sách thành phần.
# Chạy: python3 tests/e2e/he-thong-thanh-phan.e2e.py
import asyncio, os, sys, time
from playwright.async_api import async_playwright

sys.path.insert(0, os.path.dirname(__file__))
from _auth import BASE, restore_session, ensure_authenticated, step  # noqa: E402

SHOTS = "/tmp/browser/thanh-phan"
TAG = f"E2E-TP-{int(time.time())}"


async def run(page):
    log, errs = [], []
    page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)

    await page.goto(f"{BASE}/he-thong/thanh-phan", wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(4000)
    await page.screenshot(path=f"{SHOTS}/01-list.png")
    if not await ensure_authenticated(page, SHOTS, "thanh-phan"):
        return ["FAIL — chưa có phiên đăng nhập, bị chuyển về trang đăng nhập"], errs

    step(log, "Mở danh sách Thành phần & Tài sản", await page.get_by_role("tab", name="DANH SÁCH").count() > 0)

    # Tab THEO THÀNH PHẦN / THEO TÀI SẢN
    for nhan in ("THEO THÀNH PHẦN", "THEO TÀI SẢN"):
        tab = page.get_by_role("tab", name=nhan, exact=False).first
        ok = await tab.count() > 0
        if ok:
            await tab.click()
            await page.wait_for_timeout(2500)
            await page.screenshot(path=f"{SHOTS}/02-{nhan.split()[-1].lower()}.png")
        step(log, f"Chuyển tab {nhan}", ok)

    # Cây đơn vị trong danh sách thành phần
    tree = page.locator('[role="tree"], [role="treeitem"]')
    step(log, "Cây đơn vị hiển thị trong danh sách", await tree.count() > 0,
         f"{await tree.count()} node")

    # Thêm thành phần
    add = page.get_by_role("button", name="Thêm", exact=False).first
    if await add.count() == 0:
        step(log, "Tìm nút Thêm thành phần", False, "không thấy nút")
        return log, errs
    await add.click()
    await page.wait_for_timeout(1500)
    dlg = page.locator('[role="dialog"]')
    step(log, "Mở form thêm thành phần", await dlg.count() > 0)
    if await dlg.count() == 0:
        return log, errs
    inp = dlg.locator("input:visible").first
    await inp.fill(f"{TAG} Thành phần")
    await page.screenshot(path=f"{SHOTS}/03-add-form.png")
    save = page.get_by_role("button", name="Lưu", exact=False).first
    await save.click()
    await page.wait_for_timeout(3000)
    await page.reload(wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(6000)
    created = await page.get_by_text(TAG, exact=False).count()
    step(log, "Thêm thành phần và ghi CSDL", created > 0, f"{created} kết quả sau reload")
    await page.screenshot(path=f"{SHOTS}/04-after-add.png")
    if created == 0:
        return log, errs

    # Sửa
    row = page.locator('tr, [role="treeitem"], [data-row]', has_text=TAG).first
    edit = row.get_by_role("button", name="Sửa", exact=False).first
    if await edit.count() == 0:
        edit = row.locator("button").first
    await edit.click()
    await page.wait_for_timeout(1500)
    dlg = page.locator('[role="dialog"], [role="complementary"], aside')
    field = dlg.locator("input:visible").first
    val = await field.input_value() if await field.count() else ""
    step(log, "Hydrate dữ liệu vào form sửa", TAG in val, f"giá trị='{val}'")
    if TAG in val:
        await field.fill(f"{TAG}-upd")
        await page.get_by_role("button", name="Lưu", exact=False).first.click()
        await page.wait_for_timeout(3000)
        await page.reload(wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(6000)
        step(log, "Lưu cập nhật và persist", await page.get_by_text(f"{TAG}-upd", exact=False).count() > 0)
        await page.screenshot(path=f"{SHOTS}/05-after-update.png")

    # Xoá
    row = page.locator('tr, [role="treeitem"], [data-row]', has_text=TAG).first
    dele = row.get_by_role("button", name="Xoá", exact=False).first
    if await dele.count() == 0:
        dele = row.get_by_role("button", name="Xóa", exact=False).first
    if await dele.count() == 0:
        step(log, "Xoá thành phần", False, "không thấy nút xoá trên dòng")
    else:
        await dele.click()
        await page.wait_for_timeout(1200)
        if await page.locator('[role="alertdialog"]').count() > 0:
            await page.locator('[role="alertdialog"]').get_by_role("button", name="Xo", exact=False).last.click()
        await page.wait_for_timeout(2500)
        await page.reload(wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(6000)
        step(log, "Xoá thành phần khỏi CSDL", await page.get_by_text(TAG, exact=False).count() == 0)
    await page.screenshot(path=f"{SHOTS}/06-after-delete.png")
    return log, errs


async def main():
    os.makedirs(SHOTS, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        c = await b.new_context(viewport={"width": 1280, "height": 1800})
        await c.tracing.start(screenshots=True, snapshots=True)
        pg = await c.new_page()
        await restore_session(c, pg)
        try:
            log, errs = await run(pg)
        except Exception as e:  # noqa: BLE001
            log, errs = [f"FAIL — ngoại lệ: {e}"], []
        await c.tracing.stop(path=f"{SHOTS}/trace.zip")
        print("=== /he-thong/thanh-phan ===")
        for line in log:
            print("  ", line)
        for e in list(dict.fromkeys(errs))[:5]:
            print("   CONSOLE:", e[:200])
        await b.close()


asyncio.run(main())
