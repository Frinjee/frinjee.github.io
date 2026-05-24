// Parses URLs and calls only requestDeliveryInfo for Panopto
// Implements scanPanoptoLinks (bulk scan like List page)
// Implements queuePanoptoDownloads with mode = 'auto' | 'manual'
// On auto: choose primary stream, open direct URLs or copy HLS URLs
// On manual: open a small selection popup where the user picks a stream, then download/copy that one

function parsePanoptoUrl(raw) {
  try {
    const u = new URL(raw);
    const q = u.searchParams;
    const id = q.get('id') || q.get('tid');
    const isTid = !!q.get('tid');
    if (!id) return null;
    return {
      base: `${u.protocol}//${u.host}`,
      url: raw,
      id,
      isTid,
      titleHint: u.pathname.includes('Viewer.aspx') ? 'Viewer' : 'Panopto link',
    };
  } catch {
    return null;
  }
}

// port of the core API wrapper from the userscript: only DeliveryInfo logic
async function requestDeliveryInfo(videoId, isTid, base) {
  const endpoint = `${base}/Panopto/Pages/Viewer/DeliveryInfo.aspx`;
  const body = isTid
    ? `&tid=${encodeURIComponent(videoId)}&isLiveNotes=false&refreshAuthCookie=true&isActiveBroadcast=false&isEditing=false&isKollectiveAgentInstalled=false&isEmbed=false&responseType=json`
    : `deliveryId=${encodeURIComponent(videoId)}&isEmbed=true&responseType=json`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    credentials: 'include',
    body,
  });

  if (res.status === 401 || res.status === 403) {
    const error = new Error('Not authorized or not logged in');
    error.code = 'AUTH';
    throw error;
  }
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}`);
    error.code = 'HTTP';
    throw error;
  }

  const data = await res.json();
  if (data.ErrorCode) {
    const error = new Error(data.ErrorMessage || 'Panopto error');
    error.code = data.ErrorCode;
    throw error;
  }
  return data;
}

function extractStreamsFromDelivery(data) {
  const delivery = (data && data.Delivery) || {};
  const podcasts = delivery.PodcastStreams || [];
  const streams = delivery.Streams || [];
  const captions = delivery.AvailableCaptions || [];
  const title = delivery.SessionName || '';

  const primary = podcasts[0] && podcasts[0].StreamUrl;
  const alternate = streams
    .filter(s => !primary || s.StreamUrl !== primary)
    .map(s => ({
      name: s.Name || 'Stream',
      url: s.StreamUrl,
    }));

  return { primary, alternate, captions, title };
}

async function getClipboardAccess() {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText('');
    return true;
  } catch {
    return false;
  }
}

// 1. Scan links and check login (bulk, like List.aspx)
window.scanPanoptoLinks = async function scanPanoptoLinks(rawUrls) {
  const parsed = rawUrls
    .map(parsePanoptoUrl)
    .filter(Boolean);

  if (!parsed.length) {
    return { loggedIn: false, items: [] };
  }

  const base = parsed[0].base;
  let loggedIn = true;
  const loginUrl = `${base}/Panopto/Pages/Auth/Login.aspx`;

  try {
    await requestDeliveryInfo(parsed[0].id, parsed[0].isTid, base);
  } catch (e) {
    if (e.code === 'AUTH' || (e.message && e.message.toLowerCase().includes('login'))) {
      loggedIn = false;
    }
  }

  const items = parsed.map(p => ({
    url: p.url,
    id: p.id,
    isTid: p.isTid,
    title: p.titleHint,
  }));

  return { loggedIn, loginUrl, items };
};

// simple manual chooser popup for streams
function showStreamChooser(title, primaryUrl, alternate, onChoose) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.inset = '0';
  wrapper.style.background = 'rgba(0,0,0,0.6)';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.zIndex = '9999';

  const panel = document.createElement('div');
  panel.style.width = 'min(420px, 100vw)';
  panel.style.maxHeight = '80vh';
  panel.style.overflow = 'auto';
  panel.style.borderRadius = '16px';
  panel.style.background = '#2a2833';
  panel.style.border = '1px solid #262431';
  panel.style.boxShadow = '0 24px 60px rgba(0,0,0,0.85)';
  panel.style.padding = '16px';

  const h = document.createElement('div');
  h.style.fontFamily = '"Lexend", system-ui, sans-serif';
  h.style.fontSize = '16px';
  h.style.fontWeight = '650';
  h.style.color = '#fbf8ff';
  h.textContent = `Choose stream for: ${title || 'session'}`;

  const p = document.createElement('div');
  p.style.fontFamily = '"Atkinson Hyperlegible", system-ui, sans-serif';
  p.style.fontSize = '11px';
  p.style.fontWeight = '500';
  p.style.color = '#ada9bb';
  p.style.margin = '6px 0 10px 0';
  p.textContent = 'Default is usually the podcast stream. Alternate streams may have different layouts or quality.';

  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '6px';

  const addOption = (label, url) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.style.fontFamily = '"Comic Relief", system-ui, sans-serif';
    btn.style.fontSize = '12px';
    btn.style.fontWeight = '560';
    btn.style.borderRadius = '999px';
    btn.style.padding = '6px 10px';
    btn.style.border = '1px solid #4b465a';
    btn.style.background = '#3b3848';
    btn.style.color = '#fbf7ff';
    btn.style.cursor = 'pointer';
    btn.onclick = () => {
      document.body.removeChild(wrapper);
      onChoose(url);
    };
    list.appendChild(btn);
  };

  if (primaryUrl) {
    addOption('Default podcast stream', primaryUrl);
  }
  alternate.forEach((s, idx) => {
    addOption(`Alt ${idx + 1}: ${s.name}`, s.url);
  });

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Cancel';
  close.style.marginTop = '10px';
  close.style.fontFamily = '"Comic Relief", system-ui, sans-serif';
  close.style.fontSize = '12px';
  close.style.borderRadius = '999px';
  close.style.padding = '5px 10px';
  close.style.border = '1px solid #4b465a';
  close.style.background = '#1e1c26';
  close.style.color = '#fbf7ff';
  close.style.cursor = 'pointer';
  close.onclick = () => {
    document.body.removeChild(wrapper);
  };

  panel.appendChild(h);
  panel.appendChild(p);
  panel.appendChild(list);
  panel.appendChild(close);
  wrapper.appendChild(panel);
  document.body.appendChild(wrapper);
}

// 2–4. Queue downloads with mode: auto or manual
window.queuePanoptoDownloads = async function queuePanoptoDownloads(items, mode, callback) {
  if (!items || !items.length) return;
  const firstParsed = parsePanoptoUrl(items[0].url);
  if (!firstParsed) {
    callback({ url: '[system]', status: 'error', message: 'Unable to determine Panopto base URL.' });
    return;
  }
  const base = firstParsed.base;
  const canClipboard = await getClipboardAccess();

  for (const item of items) {
    const parsed = parsePanoptoUrl(item.url);
    if (!parsed) {
      callback({ url: item.url, status: 'error', message: 'Invalid Panopto URL.' });
      continue;
    }
    callback({ url: item.url, status: 'info', message: 'Contacting Panopto…' });

    try {
      const data = await requestDeliveryInfo(parsed.id, parsed.isTid, base);
      const { primary, alternate, title } = extractStreamsFromDelivery(data);
      if (!primary && !alternate.length) {
        callback({ url: item.url, status: 'error', message: 'No usable streams found (downloads may be disabled).' });
        continue;
      }

      const useUrl = await (async () => {
        if (mode === 'manual' && (primary || alternate.length)) {
          return new Promise(resolve => {
            showStreamChooser(title, primary, alternate, resolve);
          });
        }
        return primary || (alternate[0] && alternate[0].url);
      })();

      if (!useUrl) {
        callback({ url: item.url, status: 'error', message: 'No stream selected.' });
        continue;
      }

      const isHls = useUrl.endsWith('.m3u8') || /panobf\d+/i.test(useUrl);

      if (!isHls) {
        window.open(useUrl, '_blank');
        callback({
          url: item.url,
          status: 'ok',
          message: 'Opened direct download in new tab.',
        });
      } else {
        if (canClipboard) {
          await navigator.clipboard.writeText(useUrl);
          callback({
            url: item.url,
            status: 'ok',
            message: 'Stream URL copied to clipboard (use with Panopto-Video-DL or ffmpeg).',
          });
        } else {
          window.open(useUrl, '_blank');
          callback({
            url: item.url,
            status: 'ok',
            message: 'Opened stream URL in new tab; copy it or use your preferred downloader.',
          });
        }
      }
    } catch (e) {
      if (e && e.code === 'AUTH') {
        callback({
          url: item.url,
          status: 'error',
          message: 'Not logged in or not authorized for this video. Sign into Panopto and retry.',
        });
      } else {
        callback({
          url: item.url,
          status: 'error',
          message: 'Download failed: ' + (e && e.message ? e.message : String(e)),
        });
      }
    }
  }
};