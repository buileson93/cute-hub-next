# MIRATS Browser Extension: Integration Guide

## 1. Prerequisites

- MIRATS Account with project access.
- Chrome or Edge browser (Manifest V3 compatible).

## 2. Setting Up the Extension

1. Go to **Cài đặt -> Hệ thống -> Browser Extension**.
2. Click **"Tạo API Key mới"**.
3. Provide a name (e.g., "My Laptop Chrome").
4. Select Scopes:
   - `projects:read`: Required to list projects.
   - `project_correspondence:write`: Required to upload documents.
5. **Copy the full token immediately.** It will not be shown again.
   - Format: `mrt_ext_live_<key_id>_<secret>`

## 3. Pairing

1. Open the MIRATS Extension popup.
2. Paste your API Key into the settings field.
3. Click **"Kết nối"**.

## 4. Uploading Correspondence (Công văn)

1. Navigate to a PDF in your browser or select a local file.
2. Open the extension and select the **Project** and **Task** (optional).
3. Click **"Upload & Link"**.
4. The document will appear in the project's **Timeline** and **Document Registry**.

## 5. Security Best Practices

- **Rotate keys regularly** (every 90 days recommended).
- **Revoke keys immediately** if a device is lost or compromised.
- Avoid sharing API keys with other users.
