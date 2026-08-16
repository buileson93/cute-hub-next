export function renderErrorPage(error?: any): string {
  let errorMsg = 'Unknown error';
  let stack = '';
  let name = 'Error';
  
  if (error instanceof Error) {
    errorMsg = error.message;
    stack = error.stack || '';
    name = error.name;
  } else if (error && typeof error === 'object') {
    try {
      // Handle non-Error objects that might have useful properties
      const details = {
        message: error.message || error.error || 'Unknown object error',
        code: error.code,
        status: error.status,
        ...error
      };
      errorMsg = JSON.stringify(details, null, 2);
    } catch {
      errorMsg = String(error);
    }
  } else {
    errorMsg = String(error || 'Unknown error');
  }

  // Add environment context for diagnostics (server-only)
  const isServer = typeof window === 'undefined';
  const envContext = isServer ? `
    <div style="margin-top: 1rem; font-size: 0.75rem; color: #6b7280; border-top: 1px solid #e5e7eb; pt-2;">
      Runtime: ${typeof (globalThis as any).process !== 'undefined' ? 'Node/Worker' : 'Browser'}
      | URL: ${typeof (globalThis as any).Request !== 'undefined' ? 'Request available' : 'N/A'}
    </div>
  ` : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Critical Error - MIRATS 2.0</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 60rem; width: 100%; text-align: left; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
      h1 { font-size: 1.5rem; margin: 0 0 1rem; color: #991b1b; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .error-details { background: #fee2e2; padding: 1.5rem; border-radius: 0.25rem; margin-bottom: 1.5rem; overflow-x: auto; border: 1px solid #fecaca; }
      pre { margin: 0; font-family: 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace; font-size: 0.85rem; line-height: 1.6; color: #991b1b; white-space: pre-wrap; word-break: break-all; }
      .actions { display: flex; gap: 0.5rem; justify-content: flex-start; flex-wrap: wrap; margin-top: 2rem; }
      a, button { padding: 0.625rem 1.25rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: all 0.2s; }
      .primary { background: #111; color: #fff; }
      .primary:hover { background: #333; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
      .secondary:hover { background: #f9fafb; }
      .label { font-weight: bold; text-transform: uppercase; font-size: 0.75rem; color: #7f1d1d; margin-bottom: 0.5rem; display: block; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Hệ thống gặp lỗi nghiêm trọng (500)</h1>
      <p>Ứng dụng không thể xử lý yêu cầu này do một lỗi không mong đợi ở phía máy chủ.</p>
      
      <div class="error-details">
        <span class="label">Loại lỗi: ${name}</span>
        <span class="label">Chi tiết:</span>
        <pre>${errorMsg}</pre>
        
        ${stack ? `
        <div style="margin-top: 1.5rem;">
          <span class="label">Stack Trace:</span>
          <pre>${stack}</pre>
        </div>` : ''}
        ${envContext}
      </div>

      <div class="actions">
        <button class="primary" onclick="location.reload()">Thử lại</button>
        <a class="secondary" href="/">Quay về Trang chủ</a>
      </div>
    </div>
  </body>
</html>`;
}
