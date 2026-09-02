# Helper dùng chung cho các kịch bản Playwright: khôi phục phiên đăng nhập thật
# từ biến môi trường do Lovable inject (không hard-code thông tin đăng nhập).
import json, os

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:8080")


async def restore_session(context, page):
    """Nạp cookie + localStorage của phiên Supabase trước khi vào route bảo vệ."""
    cj = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cj:
        await context.add_cookies([{**c, "url": BASE} for c in json.loads(cj)])
    await page.goto(BASE, wait_until="domcontentloaded", timeout=90000)
    key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    sess = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    if key and sess:
        await page.evaluate(
            f"localStorage.setItem({json.dumps(key)}, {json.dumps(sess)})"
        )
    return bool(key and sess) or bool(cj)


async def ensure_authenticated(page, shots_dir, name):
    """Trả về False (và chụp màn hình) nếu bị đẩy về trang đăng nhập."""
    if "/auth" in page.url or "dang-nhap" in page.url:
        await page.screenshot(path=f"{shots_dir}/{name}-unauthenticated.png")
        return False
    return True


def step(log, label, ok, detail=""):
    log.append(f"{'PASS' if ok else 'FAIL'} — {label}{(' :: ' + detail) if detail else ''}")
    return ok
