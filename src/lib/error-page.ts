export function renderErrorPage(error?: any): string {
  const errorMsg = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
  const stack = error instanceof Error ? error.stack : '';
  
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 48rem; width: 100%; text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .error-details { text-align: left; background: #fee2e2; padding: 1rem; border-radius: 0.25rem; margin-bottom: 1.5rem; overflow-x: auto; }
      pre { margin: 0; font-size: 0.8rem; color: #991b1b; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end.</p>
      
      <div class="error-details">
        <pre><strong>Error:</strong> ${errorMsg}\n\n<strong>Stack:</strong>\n${stack}</pre>
      </div>

      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
