// The pages the login listener shows in the browser. Self-contained (inline styles, no requests),
// with the colors of Planeshift's design tokens.
const TONES = {
  success: { color: "#7be0ae", background: "#12392a", icon: '<path d="M20 6 9 17l-5-5"/>' },
  danger: { color: "#ff9b8a", background: "#3d1a16", icon: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>' },
};

export function page({ tone, title, message }) {
  const { color, background, icon } = TONES[tone];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Planeshift</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    font-family: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #e8ecf5;
    background: radial-gradient(ellipse at 50% 30%, #1a2140 0%, #0e1220 65%);
  }
  main {
    width: 100%;
    max-width: 420px;
    padding: 40px 32px;
    text-align: center;
    background: #161d38;
    border: 1px solid #26305a;
    border-radius: 16px;
  }
  .brand { margin: 0 0 28px; font-size: 14px; font-weight: 600; letter-spacing: 0.04em; color: #9aa6c8; }
  .badge {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    margin: 0 auto 20px;
    border-radius: 50%;
    color: ${color};
    background: ${background};
  }
  h1 { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #f2f5fc; }
  p { margin: 0; font-size: 14px; line-height: 1.55; color: #c9d3f0; }
  .hint { margin-top: 24px; font-size: 13px; color: #9aa6c8; }
</style>
</head>
<body>
<main>
  <p class="brand">Planeshift</p>
  <div class="badge">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>
  </div>
  <h1>${title}</h1>
  <p>${message}</p>
  <p class="hint">You can close this tab.</p>
</main>
</body>
</html>
`;
}

export const authorizedPage = () =>
  page({ tone: "success", title: "Planeshift MCP is authorized", message: "Your terminal is logged in. Go back to Claude and start using your projects." });

export const deniedPage = () =>
  page({ tone: "danger", title: "Access denied", message: "No token was created. Run the login again if you change your mind." });
