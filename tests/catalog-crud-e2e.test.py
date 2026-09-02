# E2E CRUD danh muc (Playwright). Yeu cau phien dang nhap duoc inject qua bien moi truong
# LOVABLE_BROWSER_SUPABASE_* . Khong hard-code thong tin dang nhap.
import asyncio, json, os, time
from playwright.async_api import async_playwright

BASE="http://localhost:8080"
TAG=f"E2E-{int(time.time())}"

async def restore(context, page):
    cj=os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cj:
        await context.add_cookies([{**c,"url":BASE} for c in json.loads(cj)])
    await page.goto(BASE, wait_until="domcontentloaded", timeout=90000)
    k=os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"); s=os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    if k and s:
        await page.evaluate(f"localStorage.setItem({json.dumps(k)}, {json.dumps(s)})")

async def crud(page, url, singular, name):
    log=[]
    errs=[]
    page.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    await page.goto(f"{BASE}{url}", wait_until="domcontentloaded", timeout=90000)
    add0=page.get_by_role("button", name=f"Thêm {singular.lower()}", exact=False).first
    await add0.wait_for(state="visible", timeout=60000)
    await page.wait_for_timeout(1500)
    log.append(f"URL={page.url}")
    # add
    add=page.get_by_role("button", name=f"Thêm {singular.lower()}", exact=False).first
    if await add.count()==0:
        return log+[f"FAIL: no add button for {singular}"], errs
    await add.click(); await page.wait_for_timeout(1200)
    inp=page.locator("input:visible").nth(0)
    # find the name input inside dialog
    dlg=page.locator('[role="dialog"]')
    if await dlg.count()>0:
        inp=dlg.locator("input:visible").first
    await inp.fill(name)
    save=page.get_by_role("button", name="Lưu", exact=True).first
    await save.click(); await page.wait_for_timeout(2500)
    await page.reload(wait_until="domcontentloaded", timeout=90000); await page.wait_for_timeout(6000)
    found = await page.get_by_text(name, exact=False).count()
    log.append(f"CREATE {'OK' if found else 'FAIL'} ({found} matches)")
    if not found: return log, errs
    # edit
    row=page.locator('tr, [role="treeitem"], [data-row]', has_text=name).first
    edit=row.get_by_role("button", name="Sửa", exact=False).first
    if await edit.count()==0:
        edit=row.locator("button").first
    await edit.click(); await page.wait_for_timeout(1200)
    dlg=page.locator('[role="dialog"]')
    inp=dlg.locator("input:visible").first
    hydrated=await inp.input_value()
    log.append(f"HYDRATE {'OK' if name in hydrated else 'FAIL'} ('{hydrated}')")
    new=name+"-upd"
    await inp.fill(new)
    await page.get_by_role("button", name="Lưu", exact=True).first.click()
    await page.wait_for_timeout(2500)
    await page.reload(wait_until="domcontentloaded", timeout=90000); await page.wait_for_timeout(6000)
    upd=await page.get_by_text(new, exact=False).count()
    log.append(f"UPDATE {'OK' if upd else 'FAIL'}")
    # delete
    row=page.locator('tr, [role="treeitem"], [data-row]', has_text=new).first
    page.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
    dele=row.get_by_role("button", name="Xoá", exact=False).first
    if await dele.count()==0:
        log.append("DELETE FAIL: no button"); return log, errs
    await dele.click(); await page.wait_for_timeout(1500)
    cf=page.get_by_role("button", name="Xoá", exact=False).last
    try:
        if await page.locator('[role="alertdialog"]').count()>0: await cf.click()
    except Exception: pass
    await page.wait_for_timeout(2000)
    await page.reload(wait_until="domcontentloaded", timeout=90000); await page.wait_for_timeout(6000)
    left=await page.get_by_text(new, exact=False).count()
    log.append(f"DELETE {'OK' if left==0 else 'FAIL (still present)'}")
    return log, errs

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True)
        c=await b.new_context(viewport={"width":1280,"height":1800})
        pg=await c.new_page()
        await restore(c,pg)
        for url,sing in [("/danh-muc/don-vi","Đơn vị"),("/danh-muc/nha-san-xuat","Nhà sản xuất"),("/danh-muc/loai-thiet-bi","Chủng loại")]:
            print("=====",url)
            try:
                log,errs=await crud(pg,url,sing,f"{TAG} {sing}")
            except Exception as e:
                log,errs=[f"EXCEPTION {e}"],[]
            for l in log: print("  ",l)
            for e in set(errs[:5]): print("   CONSOLE:",e[:200])
        await b.close()
asyncio.run(main())
