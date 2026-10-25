// Replaces fetch for the duration of a test and records the requests. `respond` returns [status, body].
export function stubFetch(t, respond = () => [200, {}]) {
  const calls = [];
  const original = globalThis.fetch;

  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), init, body: init.body ? JSON.parse(init.body) : undefined });
    const [status, body] = respond(calls.at(-1));
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  };
  t.after(() => {
    globalThis.fetch = original;
  });

  return calls;
}

export function setEnv(t, values) {
  const original = { ...process.env };
  Object.assign(process.env, values);
  for (const key of Object.keys(values)) if (values[key] === undefined) delete process.env[key];
  t.after(() => {
    for (const key of Object.keys(values)) delete process.env[key];
    Object.assign(process.env, original);
  });
}

// A server that only records the tools registered on it, so a handler can be called directly.
export function fakeServer(register) {
  const tools = {};
  register({ registerTool: (name, config, handler) => (tools[name] = { config, handler }) });
  return tools;
}
