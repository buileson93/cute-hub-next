#!/usr/bin/env python3
"""Tạo tài khoản admin: auth.users (Admin API) + profiles + user_roles.

Dump không chứa auth.users nên bước này bắt buộc sau khi khôi phục.
Dùng: python3 scripts/restore/create-admin.py <email> <password> [full_name]
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request


def api(url: str, key: str, path: str, payload=None, method="POST"):
    req = urllib.request.Request(
        url.rstrip("/") + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def main():
    if len(sys.argv) < 3:
        sys.exit("Dùng: create-admin.py <email> <password> [full_name]")
    email, password = sys.argv[1], sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else email.split("@")[0]

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit("Thiếu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong môi trường.")

    status, body = api(
        url, key, "/auth/v1/admin/users",
        {"email": email, "password": password, "email_confirm": True,
         "user_metadata": {"full_name": full_name}},
    )
    user_id = body.get("id")
    if not user_id:
        # user đã tồn tại -> tra id rồi đổi mật khẩu
        st, lst = api(url, key, f"/auth/v1/admin/users?email={email}", method="GET")
        users = lst.get("users") or []
        if not users:
            sys.exit(f"Không tạo được user ({status}): {body}")
        user_id = users[0]["id"]
        api(url, key, f"/auth/v1/admin/users/{user_id}",
            {"password": password, "email_confirm": True}, method="PUT")
        print(f"User đã tồn tại, đã đặt lại mật khẩu: {user_id}")
    else:
        print(f"Đã tạo user: {user_id}")

    sql = f"""
    INSERT INTO public.profiles (id, email, full_name, active)
    VALUES ('{user_id}', '{email}', '{full_name}', true)
    ON CONFLICT (id) DO UPDATE SET active = true, email = EXCLUDED.email;

    INSERT INTO public.user_roles (user_id, role)
    VALUES ('{user_id}', 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    """
    res = subprocess.run(["psql", "-v", "ON_ERROR_STOP=1", "-q", "-c", sql],
                         capture_output=True, text=True)
    if res.returncode != 0:
        print("Cảnh báo khi ghi profiles/user_roles:", res.stderr.strip())
        print("Kiểm tra tên cột thực tế của bảng profiles rồi chạy lại thủ công.")
        sys.exit(1)
    print(f"Hoàn tất: {email} là admin, profile active.")


if __name__ == "__main__":
    main()
