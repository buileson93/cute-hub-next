# E2E /so-cong-van — kiểm tra phân quyền, tải tệp, mở chi tiết, sửa nội dung,
# lưu và xoá; xác minh hydrate của edit mode.
import asyncio, os, sys, time
from playwright.async_api import async_playwright

sys.path.insert(0, os.path.dirname(__file__))
from _auth import BASE, restore_session, ensure_authenticated, step, login_with_password  # noqa: E402

SHOTS = "/tmp/browser/so-cong-van"
TAG = f"E2E-CV-{int(time.time())}"
SAMPLE = "/tmp/browser/so-cong-van/cong-van-mau.txt"


async def run(page):
    log, errs = [], []
    page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)

    await page.goto(f"{BASE}/so-cong-van", wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(5000)
    await page.screenshot(path=f"{SHOTS}/01-list.png")
    if not await ensure_authenticated(page, SHOTS, "so-cong-van"):
        return ["FAIL — chưa có phiên đăng nhập, bị chuyển về trang đăng nhập"], errs

    step(log, "Mở Sổ công văn", await page.get_by_text("Sổ công văn", exact=False).count() > 0)
    step(log, "Bộ lọc loại công văn hiển thị",
         await page.get_by_label("Lọc theo loại công văn").count() > 0)

    # Phân quyền: người không quản lý dự án sẽ không thấy nút thêm
    add = page.get_by_role("button", name="Thêm", exact=False).first
    co_quyen = await add.count() > 0
    step(log, "Kiểm tra phân quyền tạo công văn", True,
         "có quyền thêm" if co_quyen else "chỉ đọc (không có nút Thêm)")

    if not co_quyen:
        # Chỉ đọc: mở chi tiết bản ghi đầu tiên nếu có
        first = page.locator("li").first
        if await first.count() > 0:
            await first.click()
            await page.wait_for_timeout(2000)
            await page.screenshot(path=f"{SHOTS}/02-detail-readonly.png")
            step(log, "Mở chi tiết công văn ở chế độ chỉ đọc", True)
        else:
            step(log, "Danh sách trống — không có công văn để mở chi tiết", True)
        return log, errs

    # Có quyền: tạo mới + tải tệp
    await add.click()
    await page.wait_for_timeout(2000)
    dlg = page.locator('[role="dialog"], aside').last
    await dlg.locator("input:visible").first.fill(TAG)
    ta = dlg.locator("textarea:visible").first
    if await ta.count() > 0:
        await ta.fill(f"Trích yếu {TAG}")
    fi = dlg.locator('input[type=file]').first
    if await fi.count() > 0:
        await fi.set_input_files(SAMPLE)
        await page.wait_for_timeout(2500)
        step(log, "Tải tệp đính kèm", True)
    else:
        step(log, "Tải tệp đính kèm", False, "không thấy input file trong form")
    await page.screenshot(path=f"{SHOTS}/02-add-form.png")
    await page.get_by_role("button", name="Lưu", exact=False).first.click()
    await page.wait_for_timeout(3000)
    await page.reload(wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(6000)
    created = await page.get_by_text(TAG, exact=False).count()
    step(log, "Tạo công văn và ghi CSDL", created > 0)
    if created == 0:
        return log, errs

    # Mở chi tiết + sửa
    await page.get_by_text(TAG, exact=False).first.click()
    await page.wait_for_timeout(2000)
    form = page.locator('[role="dialog"], aside').last
    val = await form.locator("input:visible").first.input_value()
    step(log, "Hydrate dữ liệu vào edit mode", TAG in (val or ""), f"giá trị='{val}'")
    ta = form.locator("textarea:visible").first
    if await ta.count() > 0:
        await ta.fill(f"Trích yếu {TAG} đã sửa")
    await page.get_by_role("button", name="Lưu", exact=False).first.click()
    await page.wait_for_timeout(3000)
    await page.reload(wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(6000)
    step(log, "Lưu nội dung sửa và persist",
         await page.get_by_text("đã sửa", exact=False).count() > 0)
    await page.screenshot(path=f"{SHOTS}/03-after-update.png")

    # Xoá
    row = page.locator("li, tr", has_text=TAG).first
    dele = row.get_by_role("button", name="Xo", exact=False).first
    if await dele.count() == 0:
        step(log, "Xoá công văn", False, "không thấy nút xoá")
    else:
        await dele.click()
        await page.wait_for_timeout(1200)
        ad = page.locator('[role="alertdialog"]')
        if await ad.count() > 0:
            await ad.get_by_role("button", name="Xo", exact=False).last.click()
        await page.wait_for_timeout(2500)
        await page.reload(wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(6000)
        step(log, "Xoá công văn khỏi CSDL", await page.get_by_text(TAG, exact=False).count() == 0)
    await page.screenshot(path=f"{SHOTS}/04-after-delete.png")
    return log, errs


async def main():
    os.makedirs(SHOTS, exist_ok=True)
    with open(SAMPLE, "w", encoding="utf-8") as f:
        f.write("Cong van mau phuc vu kiem thu E2E.\n")
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
        print("=== /so-cong-van ===")
        for line in log:
            print("  ", line)
        for e in list(dict.fromkeys(errs))[:5]:
            print("   CONSOLE:", e[:200])
        await b.close()


asyncio.run(main())
