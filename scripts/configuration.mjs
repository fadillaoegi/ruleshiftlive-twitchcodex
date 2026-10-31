// Shared, side-effect-free startup validation. Never include input values in
// errors: a misplaced credential must not leak through diagnostics or logs.
export function configuration(env) {
  const address = env.HTTP_ADDR || '127.0.0.1:8080';
  const origin = env.WEB_ORIGIN || 'http://localhost:5174';
  let backendURL, webURL;
  try {
    backendURL = new URL(`http://${address}`);
    webURL = new URL(origin);
    if (!/^(127\.0\.0\.1|\[::1\]):[0-9]+$/.test(address)
      || !['127.0.0.1', '[::1]'].includes(backendURL.hostname)
      || backendURL.origin !== `http://${address}` || backendURL.port === '0'
      || !['localhost', '127.0.0.1'].includes(webURL.hostname)
      || webURL.protocol !== 'http:' || webURL.origin !== origin || webURL.port === '0') throw new Error();
  } catch {
    throw new Error('Use a loopback HTTP_ADDR and a local WEB_ORIGIN with valid nonzero ports, as shown in backend/.env.example.');
  }
  const callback = new URL('/auth/twitch/callback', webURL);
  callback.port = backendURL.port || '80';
  const redirectURI = env.TWITCH_REDIRECT_URI || callback.href;
  if (redirectURI !== callback.href) {
    throw new Error('TWITCH_REDIRECT_URI must use the WEB_ORIGIN hostname, the HTTP_ADDR port and /auth/twitch/callback. Register that exact URL in your Twitch app.');
  }
  return { address, origin, backendURL, webURL, redirectURI };
}
