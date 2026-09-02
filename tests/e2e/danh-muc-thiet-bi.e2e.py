# E2E /danh-muc/thiet-bi — thêm tài sản, bật edit mode, sửa giá / đơn vị /
# hệ thống có thể thay thế, rồi xoá; xác minh hydrate và persist sau reload.
import asyncio, os, sys, time
from playwright.async_api import async_playwright

sys.path.insert(0, os.path.dirname(__file__))
from _auth import BASE, restore_session, ensure_authenticated, step, login_with_password  # noqa: E402

SHOTS = "/tmp/browser/thiet-bi"
TAG = f"E2E-TS-{int(time.time())}"


async def fill_first_visible(scope, label_texts, value):
    for lbl in label_texts:
        f = scope.get_by_label(lbl, exact=False).first
        if await f.count() > 0:
            try:
                await f.fill(value)
                return True
            except Exception:  # noqa: BLE001
                continue
    return False


async def run(page):
    log, errs = [], []
    page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)

    await page.goto(f"{BASE}/danh-muc/thiet-bi", wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(5000)
    await page.screenshot(path=f"{SHOTS}/01-list.png")
    if not await ensure_authenticated(page, SHOTS, "thiet-bi"):
        return ["FAIL — chưa có phiên đăng nhập, bị chuyển về trang đăng nhập"], errs
    step(log, "Mở Danh mục tài sản", await page.get_by_text("Tài sản", exact=False).count() > 0)

    add = page.get_by_role("button", name="Thêm tài sản", exact=False).first
    if await add.count() == 0:
        add = page.get_by_role("button", name="Thêm", exact=False).first
    if await add.count() == 0:
        return log + ["FAIL — không thấy nút Thêm tài sản"], errs
    await add.click()
    await page.wait_for_timeout(2000)
    dlg = page.locator('[role="dialog"]')
    step(log, "Mở form thêm tài sản", await dlg.count() > 0)
    if await dlg.count() == 0:
        return log, errs
    await page.screenshot(path=f"{SHOTS}/02-add-form.png")

    # Tên / Serial
    filled = await fill_first_visible(dlg, ["Tên", "Serial", "Số serial"], TAG)
    if not filled:
        await dlg.locator("input:visible").first.fill(TAG)
    # Model bắt buộc: chọn giá trị đầu tiên trong combobox nếu có
    cb = dlg.get_by_role("combobox").first
    if await cb.count() > 0:
        await cb.click()
        await page.wait_for_timeout(800)
        opt = page.get_by_role("option").first
        if await opt.count() > 0:
            await opt.click()
    await page.get_by_role("button", name="Lưu", exact=False).first.click()
    await page.wait_for_timeout(3500)
    await page.reload(wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(7000)
    created = await page.get_by_text(TAG, exact=False).count()
    step(log, "Thêm tài sản và ghi CSDL", created > 0, f"{created} kết quả")
    await page.screenshot(path=f"{SHOTS}/03-after-add.png")
    if created == 0:
        return log, errs

    # Mở edit mode
    row = page.locator("tr", has_text=TAG).first
    edit = row.get_by_role("button", name="Sửa", exact=False).first
    if await edit.count() == 0:
        kebab = row.get_by_role("button").last
        await kebab.click()
        await page.wait_for_timeout(800)
        edit = page.get_by_role("menuitem", name="Sửa", exact=False).first
    await edit.click()
    await page.wait_for_timeout(2500)
    form = page.locator('[role="dialog"], aside, form').first
    val = await form.locator("input:visible").first.input_value()
    step(log, "Hydrate dữ liệu tài sản vào edit mode", TAG in (val or ""), f"giá trị='{val}'")
    await page.screenshot(path=f"{SHOTS}/04-edit-mode.png")

    # Sửa giá
    gia_ok = await fill_first_visible(form, ["Giá", "Nguyên giá", "Giá trị"], "12345000")
    step(log, "Sửa trường Giá", gia_ok)
    # Sửa đơn vị
    dv = form.get_by_label("Đơn vị", exact=False).first
    dv_ok = False
    if await dv.count() > 0:
        try:
            await dv.click()
            await page.wait_for_timeout(700)
            o = page.get_by_role("option").first
            if await o.count() > 0:
                await o.click()
                dv_ok = True
        except Exception:  # noqa: BLE001
            dv_ok = False
    step(log, "Sửa Đơn vị sở hữu", dv_ok)
    # Hệ thống có thể thay thế
    compat = form.get_by_text("thay thế", exact=False).first
    step(log, "Khối “Hệ thống có thể thay thế” hiển thị", await compat.count() > 0)

    await page.get_by_role("button", name="Lưu", exact=False).first.click()
    await page.wait_for_timeout(3000)
    await page.reload(wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(7000)
    step(log, "Persist sau khi lưu", await page.get_by_text(TAG, exact=False).count() > 0)
    await page.screenshot(path=f"{SHOTS}/05-after-update.png")

    # Xoá
    row = page.locator("tr", has_text=TAG).first
    kebab = row.get_by_role("button").last
    await kebab.click()
    await page.wait_for_timeout(800)
    item = page.get_by_role("menuitem", name="Xo", exact=False).first
    if await item.count() == 0:
        item = page.get_by_role("menuitem", name="Loại bỏ", exact=False).first
    if await item.count() == 0:
        step(log, "Xoá tài sản", False, "không thấy mục xoá trong menu")
    else:
        await item.click()
        await page.wait_for_timeout(1200)
        ad = page.locator('[role="alertdialog"], [role="dialog"]').last
        ta = ad.locator("textarea:visible, input:visible").first
        if await ta.count() > 0:
            await ta.fill("Kiểm thử E2E tự động")
        btn = ad.get_by_role("button", name="Xo", exact=False).last
        if await btn.count() > 0:
            await btn.click()
        await page.wait_for_timeout(3000)
        await page.reload(wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(7000)
        step(log, "Xoá tài sản khỏi danh sách", await page.get_by_text(TAG, exact=False).count() == 0)
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
        await login_with_password(pg)
        try:
            log, errs = await run(pg)
        except Exception as e:  # noqa: BLE001
            log, errs = [f"FAIL — ngoại lệ: {e}"], []
        await c.tracing.stop(path=f"{SHOTS}/trace.zip")
        print("=== /danh-muc/thiet-bi ===")
        for line in log:
            print("  ", line)
        for e in list(dict.fromkeys(errs))[:5]:
            print("   CONSOLE:", e[:200])
        await b.close()


asyncio.run(main())
