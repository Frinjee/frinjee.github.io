#!/usr/bin/env python3
'''
tools/validate-assets.py
scan html, css, and js files in this repo for local asset references,
then report: broken references, unreferenced committed files, and path mismatches.

usage: python tools/validate-assets.py [--root PATH] [--fix-report]
'''
import argparse, os, re, sys
from pathlib import Path

# ---- config ----
SCAN_EXTS      = {'.html', '.css', '.js'}
ASSET_DIRS     = {'assets'}
IGNORE_SUBDIRS = {'.git', '.cursor', 'node_modules', '__pycache__'}

# patterns that extract local (non-http) references from source files
# group 1 = the path string
REF_PATTERNS = [
    # css url(...) — captures unquoted, single-quoted, or double-quoted
    re.compile(r'''url\(\s*['"]?([^'"\)#\s][^'"\)\s]*?)['"]?\s*\)'''),
    # html src= / href= — captures relative paths only (not http/https/data/# prefixes)
    re.compile(r'''(?:src|href)\s*=\s*['"]([^'"#\s][^'"\s]*?)['"]'''),
    # js import / require / fetch paths in string literals
    re.compile(r'''(?:import\s+.*?from\s+|require\s*\(|fetch\s*\()\s*['"](\.[^'"#\s]+)['"]'''),
]
# skip patterns — obviously external or internal
SKIP_PREFIX = ('http://', 'https://', 'data:', 'blob:', 'mailto:', '//', 'javascript:',
               '#', '?', '{', '${')
# extensions considered as local file references (not just url fragments)
ASSET_EXTS = {'.js', '.css', '.json', '.jpg', '.jpeg', '.png', '.gif', '.webp',
              '.svg', '.eot', '.ttf', '.woff', '.woff2', '.mp3', '.mp4', '.ico',
              '.html', '.txt', '.gz', '.zip', '.pdf'}


def find_source_files(root):
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_SUBDIRS]
        for fn in filenames:
            if Path(fn).suffix in SCAN_EXTS:
                files.append(Path(dirpath) / fn)
    return files


def find_committed_assets(root):
    assets = set()
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_SUBDIRS]
        for fn in filenames:
            full = Path(dirpath) / fn
            # normalize to forward-slash relative path
            rel = full.relative_to(root).as_posix()
            assets.add(rel)
    return assets


def extract_refs(src_path):
    try:
        text = src_path.read_text(encoding='utf-8', errors='replace')
    except Exception:
        return []
    refs = []
    for pat in REF_PATTERNS:
        for m in pat.finditer(text):
            raw = m.group(1).strip()
            refs.append((raw, m.start()))
    return refs


def resolve_ref(raw, src_file, root):
    '''resolve a raw reference string to a repo-root-relative posix path, or None if skip.'''
    if any(raw.startswith(p) for p in SKIP_PREFIX):
        return None
    if Path(raw).suffix not in ASSET_EXTS:
        return None
    # strip query string / fragment
    clean = raw.split('?')[0].split('#')[0]
    if not clean:
        return None
    src_dir = src_file.parent
    if clean.startswith('/'):
        # absolute from root
        resolved = root / clean.lstrip('/')
    else:
        resolved = (src_dir / clean).resolve()
    try:
        rel = Path(resolved).relative_to(Path(root).resolve()).as_posix()
    except ValueError:
        return None  # outside repo root
    return rel


def run(root_str, fix_report):
    root = Path(root_str).resolve()
    print(f'repo root: {root}')

    src_files      = find_source_files(root)
    committed      = find_committed_assets(root)
    referenced     = set()   # all refs that actually resolve to something
    broken         = []      # (src_rel, raw_ref, resolved_rel)
    ref_map        = {}      # resolved_rel -> list of src_rel

    for sf in src_files:
        sf_rel = sf.relative_to(root).as_posix()
        for raw, _ in extract_refs(sf):
            resolved = resolve_ref(raw, sf, root)
            if not resolved:
                continue
            referenced.add(resolved)
            ref_map.setdefault(resolved, []).append(sf_rel)
            if resolved not in committed:
                broken.append((sf_rel, raw, resolved))

    # unreferenced committed assets — only in asset dirs
    unreferenced = {
        r for r in committed
        if r not in referenced
        and any(r.startswith(d + '/') for d in ASSET_DIRS)
        and Path(r).suffix in ASSET_EXTS
        # exclude source files themselves (js/css/html that are the scannable files)
        and not (Path(r).suffix in SCAN_EXTS and r not in {sf.relative_to(root).as_posix() for sf in src_files})
    }
    # also exclude generated hoard data files from unreferenced noise
    unreferenced = {r for r in unreferenced if not r.startswith('hoard/')}

    # dedup broken list
    broken_dedup = {}
    for src, raw, res in broken:
        broken_dedup.setdefault(res, []).append((src, raw))

    # ---- report ----
    print(f'\nscanned {len(src_files)} source files, {len(committed)} committed assets\n')

    if broken_dedup:
        print(f'BROKEN REFERENCES ({len(broken_dedup)} unique missing files):')
        for res in sorted(broken_dedup):
            print(f'  missing: {res}')
            for src, raw in broken_dedup[res]:
                print(f'    <- "{raw}" in {src}')
    else:
        print('BROKEN REFERENCES: none')

    print()

    if unreferenced:
        print(f'UNREFERENCED COMMITTED ASSETS ({len(unreferenced)}):')
        for r in sorted(unreferenced):
            print(f'  {r}')
    else:
        print('UNREFERENCED COMMITTED ASSETS: none')

    print()

    # path mismatch heuristic: broken ref exists somewhere in repo under a different path
    mismatches = []
    for res in sorted(broken_dedup):
        fname = Path(res).name
        candidates = [c for c in committed if Path(c).name == fname and c != res]
        if candidates:
            mismatches.append((res, candidates))

    if mismatches:
        print(f'POSSIBLE PATH MISMATCHES ({len(mismatches)}):')
        for res, cands in mismatches:
            print(f'  expected: {res}')
            for c in cands:
                print(f'    actual:  {c}')
    else:
        print('POSSIBLE PATH MISMATCHES: none')

    print()
    print(f'summary: {len(broken_dedup)} broken, {len(unreferenced)} unreferenced, {len(mismatches)} possible mismatches')

    if fix_report:
        _write_fix_report(root, broken_dedup, unreferenced, mismatches)

    return 1 if broken_dedup else 0


def _write_fix_report(root, broken, unreferenced, mismatches):
    out = root / 'tools' / 'asset-fix-report.txt'
    with open(out, 'w', encoding='utf-8') as f:
        f.write('# asset fix report\n# generated by tools/validate-assets.py\n\n')
        f.write('## broken references\n')
        for res in sorted(broken):
            f.write(f'missing: {res}\n')
            for src, raw in broken[res]:
                f.write(f'  <- "{raw}" in {src}\n')
        f.write('\n## unreferenced committed assets\n')
        for r in sorted(unreferenced):
            f.write(f'{r}\n')
        f.write('\n## possible path mismatches\n')
        for res, cands in mismatches:
            f.write(f'expected: {res}\n')
            for c in cands:
                f.write(f'  actual: {c}\n')
    print(f'fix report written to {out}')


def main():
    p = argparse.ArgumentParser(description='validate local asset references in html/css/js files')
    p.add_argument('--root',       default='.', help='repo root (default: current directory)')
    p.add_argument('--fix-report', action='store_true', help='write tools/asset-fix-report.txt')
    args = p.parse_args()
    sys.exit(run(args.root, args.fix_report))


if __name__ == '__main__':
    main()
