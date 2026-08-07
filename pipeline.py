#!/usr/bin/env python3
'''
pipeline.py — offline builder for hoard search bundle
reads metadata.tsv (archive.org myspace dragon hoard), emits:
  hoard/data.<sha1[:8]>.json.gz   — immutable, cached by hash filename
  hoard/version.json              — no-cache, points at current data file

data format:
  { "p": "<common url prefix>",
    "a": ["Artist A", ...],   // string table
    "t": ["Title A", ...],    // string table
    "e": [[da, ti, "rel/url.mp3"], ...] }  // da = delta-encoded artist idx

tsv columns used: parts[1]=title, parts[3]=artist, parts[8]=mp3_url
entries sorted by artist; artist ids delta-encoded (small deltas compress well)
'''
import argparse, gzip, hashlib, json, os, random, string, sys
from datetime import datetime, timezone
from urllib.request import urlretrieve

TSV_URL = 'https://archive.org/download/myspace_dragon_hoard_searcher/metadata.tsv'
DEFAULT_OUT = 'hoard'


def download_tsv(dest):
    print(f'downloading metadata.tsv → {dest} ...')
    urlretrieve(TSV_URL, dest)
    print(f'done. {os.path.getsize(dest) // 1024 // 1024} MB')


def make_demo_entries(n=5000):
    # synthetic tracks for offline testing — random artist/title/url
    rng = random.Random(42)
    chars = string.ascii_letters + '    '
    def rword(lo, hi):
        return ''.join(rng.choice(chars) for _ in range(rng.randint(lo, hi))).strip() or 'X'
    entries = []
    for _ in range(n):
        artist = f'{rword(3,9)} {rword(3,8)}'
        title  = ' '.join(rword(3,7) for _ in range(rng.randint(1, 4)))
        path   = f'demo_item_{rng.randint(1,9999):04d}/songs/{rword(4,8)}.mp3'
        entries.append((artist, title, path))
    return entries


def stream_tsv(path):
    # yield (artist, title, mp3_url) skipping header + bad rows
    with open(path, 'rb') as f:
        for i, raw in enumerate(f):
            if i == 0:
                continue  # header
            parts = raw.split(b'\t')
            if len(parts) < 9:
                continue
            url = parts[8].strip()
            if not url:
                continue
            title  = parts[1].strip().decode('utf-8', 'replace')
            artist = parts[3].strip().decode('utf-8', 'replace')
            yield artist, title, url.decode('utf-8', 'replace')


def build_bundle(raw_entries, prefix):
    # dedupe by (artist, title, url), sort by artist then title
    seen = {}
    for artist, title, url in raw_entries:
        key = (artist.lower(), title.lower(), url)
        if key not in seen:
            seen[key] = (artist, title, url)

    sorted_entries = sorted(seen.values(), key=lambda x: (x[0].lower(), x[1].lower()))

    # build string tables
    a_map, t_map = {}, {}
    a_list, t_list = [], []

    def intern_a(s):
        if s not in a_map:
            a_map[s] = len(a_list)
            a_list.append(s)
        return a_map[s]

    def intern_t(s):
        if s not in t_map:
            t_map[s] = len(t_list)
            t_list.append(s)
        return t_map[s]

    # strip common url prefix
    p = prefix.rstrip('/')
    p_slash = p + '/'

    encoded = []
    prev_ai = 0
    for artist, title, url in sorted_entries:
        ai = intern_a(artist)
        ti = intern_t(title)
        rel = url[len(p_slash):] if url.startswith(p_slash) else url
        da = ai - prev_ai
        prev_ai = ai
        encoded.append([da, ti, rel])

    return {'p': p_slash, 'a': a_list, 't': t_list, 'e': encoded}


def find_url_prefix(raw_entries):
    # The TSV stores original dead MySpace CDN URLs (http://cache*.myspacecdn.com/...).
    # Route them through the Wayback Machine if_ endpoint so browsers receive the raw
    # archived MP3 without the toolbar HTML wrapper.
    # Timestamp 20120601000000 = peak MySpace era; WB auto-redirects to nearest snapshot.
    return 'https://web.archive.org/web/20120601000000if_/'


def write_outputs(bundle, out_dir, plain=False):
    os.makedirs(out_dir, exist_ok=True)

    payload = json.dumps(bundle, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    gz = gzip.compress(payload, compresslevel=9, mtime=0)
    h = hashlib.sha1(gz).hexdigest()[:8]

    gz_name = f'data.{h}.json.gz'
    gz_path = os.path.join(out_dir, gz_name)
    with open(gz_path, 'wb') as f:
        f.write(gz)

    ver = {
        'v': h,
        'n': len(bundle['e']),
        'built': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    }
    ver_path = os.path.join(out_dir, 'version.json')
    with open(ver_path, 'w', encoding='utf-8') as f:
        json.dump(ver, f, separators=(',', ':'))
        f.write('\n')

    if plain:
        plain_path = os.path.join(out_dir, f'data.{h}.json')
        with open(plain_path, 'wb') as f:
            f.write(payload)
        print(f'plain json: {plain_path}  ({len(payload)//1024} KB)')

    return gz_name, gz_path, ver, payload, gz


def print_stats(bundle, payload, gz, gz_name):
    entries  = len(bundle['e'])
    artists  = len(bundle['a'])
    titles   = len(bundle['t'])
    raw_kb   = len(payload) // 1024
    gz_kb    = len(gz) // 1024
    gz_mb    = gz_kb / 1024
    ratio    = len(gz) / len(payload) * 100
    print(f'entries:  {entries:>8,}')
    print(f'artists:  {artists:>8,}')
    print(f'titles:   {titles:>8,}')
    print(f'raw json: {raw_kb:>8,} KB  ({raw_kb/1024:.1f} MB)')
    print(f'gzipped:  {gz_kb:>8,} KB  ({gz_mb:.2f} MB)  ratio {ratio:.1f}%')
    print(f'output:   {gz_name}')


def round_trip_check(bundle, gz):
    # decompress and verify entry count matches
    restored = json.loads(gzip.decompress(gz))
    assert len(restored['e']) == len(bundle['e']), 'round-trip entry count mismatch'
    # verify first and last entry delta-decoding
    prev_ai = 0
    for da, ti, rel in restored['e']:
        ai = prev_ai + da
        prev_ai = ai
    assert 0 <= ai < len(restored['a']), 'delta decode out of range'
    print('round-trip ok')


def main():
    p = argparse.ArgumentParser(description='build hoard search bundle from metadata.tsv')
    p.add_argument('--tsv',   default='metadata.tsv', help='path to metadata.tsv (default: metadata.tsv)')
    p.add_argument('--out',   default=DEFAULT_OUT,    help=f'output directory (default: {DEFAULT_OUT})')
    p.add_argument('--demo',  action='store_true',    help='use 5k synthetic tracks instead of real tsv')
    p.add_argument('--plain', action='store_true',    help='also emit uncompressed data.<hash>.json')
    args = p.parse_args()

    if args.demo:
        print('demo mode: generating 5000 synthetic tracks ...')
        raw = make_demo_entries(5000)
        prefix = 'https://archive.org/download/'
    else:
        if not os.path.exists(args.tsv):
            download_tsv(args.tsv)
        else:
            print(f'reusing existing {args.tsv}  ({os.path.getsize(args.tsv)//1024//1024} MB)')
        raw = list(stream_tsv(args.tsv))
        prefix = find_url_prefix(iter(raw))

    print(f'building bundle from {len(raw)} raw rows ...')
    bundle = build_bundle(iter(raw), prefix)

    gz_name, gz_path, ver, payload, gz = write_outputs(bundle, args.out, plain=args.plain)
    print_stats(bundle, payload, gz, gz_name)
    round_trip_check(bundle, gz)
    print(f'version.json: v={ver["v"]}  n={ver["n"]}  built={ver["built"]}')


if __name__ == '__main__':
    main()
