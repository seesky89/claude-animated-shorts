# Shared audio mixer for cartoon-3d-short projects.
# Usage: python runtime/audio/mix.py --project shorts/<name> [--clean-cache]
import argparse
import json
import os
import shutil
import subprocess
import sys
import time


def parse_args():
    p = argparse.ArgumentParser(description="Shared cartoon-3d-short audio mixer")
    p.add_argument("--project", required=True, help="Path to short project folder (e.g. shorts/my_short)")
    p.add_argument("--clean-cache", action="store_true", help="Delete _cache/ after writing mix.wav")
    return p.parse_args()


if __name__ == "__main__":
    _args = parse_args()
else:
    _args = argparse.Namespace(project=os.environ.get("SHORT_PROJECT", "templates"), clean_cache=False)

RUNTIME_AUDIO = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(_args.project)
AUDIO_DIR = os.path.join(ROOT, "audio") if os.path.isdir(os.path.join(ROOT, "audio")) else ROOT
CACHE = os.path.join(AUDIO_DIR, "_cache")

# Ensure project's timeline.py takes precedence, followed by shared runtime/audio modules
sys.path.insert(0, RUNTIME_AUDIO)
sys.path.insert(0, AUDIO_DIR)

import numpy as np  # noqa: E402
from scipy import ndimage, signal  # noqa: E402
from dsp import (  # noqa: E402
    SR,
    ns,
    st,
    dbg,
    read_wav,
    write_wav,
    integrated,
    momentary,
    short_term,
    lra,
    true_peak,
    fades,
)
import timeline as T  # noqa: E402

N = ns(T.DUR)
TARGET_LUFS = -15.0
CEIL_DBTP = -1.2
DUCK_DB = -3.0

DEFAULT_MUSIC_TARGET = {
    "hook": -9.5,
    "town": -10.5,
    "march": -10.0,
    "bounce": -10.0,
    "whistle": -9.5,
    "tension": -10.0,
    "sway": -12.0,
    "swing": -11.5,
    "march2": -10.5,
    "rule": -11.5,
    "tourists": -11.0,
}
MUSIC_TARGET = getattr(T, "MUSIC_TARGET", DEFAULT_MUSIC_TARGET)
DIPS = getattr(T, "DIPS", [])

if hasattr(T, "REPORT"):
    REPORT = T.REPORT
else:
    _s = lambda i: T.shot_t(i)
    REPORT = [
        ("hook (1)", 0.0, _s(1)[1]),
        ("town (2)", *_s(2)),
        ("march (3)", *_s(3)),
        ("bounce (4-5)", _s(4)[0], _s(5)[1]),
        ("whistle (6)", *_s(6)),
        ("groan (7)", *_s(7)),
        ("snap+fall (8)", *_s(8)),
        ("water (9-10)", _s(9)[0], _s(10)[1]),
        ("sway (11)", *_s(11)),
        ("swing (12)", *_s(12)),
        ("march2 (13)", *_s(13)),
        ("rule (14)", *_s(14)),
        ("tourists (15)", _s(15)[0], T.DUR),
    ]


def log(*a):
    print(f"[{time.strftime('%H:%M:%S')}]", *a, flush=True)


def cached(name, fn):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, name + ".npy")
    if os.path.exists(p):
        log("cache hit", name)
        return np.load(p).astype(np.float64)
    x = fn()
    np.save(p, np.asarray(x, np.float32))
    return x


def load_voice():
    x, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    assert sr == SR, f"Expected {SR} Hz voice.wav, got {sr}"
    v = x[0] if x.shape[0] == 1 else x.mean(0)
    out = np.zeros(N)
    out[: min(N, len(v))] = v[:N]
    return st(out)


def speech_spans(words, merge=0.3):
    sp = []
    for w in words:
        s, e = float(w["s"]), float(w["e"])
        if sp and s - sp[-1][1] < merge:
            sp[-1][1] = max(sp[-1][1], e)
        else:
            sp.append([s, e])
    return sp


def duck_db(spans, depth=DUCK_DB, pre=0.08, post=0.12, att=0.07, rel=0.45):
    ctrl = 1000
    nc = int(T.DUR * ctrl) + 2
    va = np.zeros(nc)
    for s, e in spans:
        va[max(0, int((s - pre) * ctrl)) : int((e + post) * ctrl)] = 1.0
    ka, kr = 1 - np.exp(-1 / (att * ctrl)), 1 - np.exp(-1 / (rel * ctrl))
    env = np.zeros(nc)
    e = 0.0
    for i in range(nc):
        tgt = va[i]
        e += (tgt - e) * (ka if tgt > e else kr)
        env[i] = e
    return np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, depth * env)


def section_db(m_ducked, v):
    import music

    secs = music.SECTIONS
    gains = {}
    for name, a, b in secs:
        if name == "dropout":
            continue
        seg = slice(ns(a), ns(b))
        Lm, Lv = integrated(m_ducked[:, seg]), integrated(v[:, seg])
        gains[name] = (Lv + MUSIC_TARGET.get(name, -10.5) - Lm) if np.isfinite(Lm) else 0.0
    if "tension" in gains:
        gains["dropout"] = gains["tension"]
    pts = [(a, gains.get(name, 0.0)) for name, a, _ in secs]
    curve = np.zeros(N)
    t = np.arange(N) / SR
    for i, (a, g) in enumerate(pts):
        a_eff = 43.1 if secs[i][0] == "sway" else a
        curve[t >= a_eff] = g
    sm = ndimage.uniform_filter1d(curve, ns(0.4), mode="nearest")
    hard = np.zeros(N, bool)
    for tb in (getattr(T, "FLASH", 0.0), 43.1):
        hard[max(0, ns(tb - 0.25)) : ns(tb + 0.25)] = True
    curve = np.where(hard, curve, sm)
    for a, b, db in DIPS:
        d = np.zeros(N)
        d[ns(a) : ns(b)] = db
        curve += ndimage.uniform_filter1d(d, ns(0.06), mode="nearest")
    return curve, gains


def limiter(x, ceil_db=CEIL_DBTP, look=0.003, rel=0.08):
    c = dbg(ceil_db)
    n = x.shape[1]
    up = np.abs(signal.resample_poly(x, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    La = max(1, ns(look))
    g1 = ndimage.minimum_filter1d(gr, 2 * La + 1, mode="nearest")
    g2 = g1.copy()
    idx = np.flatnonzero(g1 < 1.0)
    if len(idx):
        kr = 1 - np.exp(-1 / (rel * SR))
        gap = ns(rel * 8)
        brk = np.flatnonzero(np.diff(idx) > gap)
        starts = np.concatenate([[idx[0]], idx[brk + 1]])
        ends = np.concatenate([idx[brk], [idx[-1]]])
        for a, b_ in zip(starts, ends):
            e = min(n, b_ + gap)
            seg = g1[a:e]
            out = np.empty(len(seg))
            g = 1.0
            for k in range(len(seg)):
                g = min(seg[k], g + (1 - g) * kr)
                out[k] = g
            g2[a:e] = out
    g3 = ndimage.uniform_filter1d(g2, 2 * La + 1, mode="nearest")
    g3 = np.minimum(g3, 1.0)
    return x * g3[None, :], g3


def lufs(x):
    v = integrated(x)
    return v if np.isfinite(v) else -99.0


def section_table(v, m, s, words):
    Mv, Mb = momentary(v), momentary(m + s)
    tc = np.arange(len(Mv)) * 0.01 + 0.2
    speak = np.zeros(len(tc), bool)
    for w in words:
        speak |= (tc >= float(w["s"]) + 0.03) & (tc <= float(w["e"]) - 0.03)
    speak &= Mv > lufs(v) - 10
    rows = []
    for name, a, b in REPORT:
        seg = slice(ns(a), ns(b))
        Lv, Lm, Ls, Lb = lufs(v[:, seg]), lufs(m[:, seg]), lufs(s[:, seg]), lufs(m[:, seg] + s[:, seg])
        k = speak & (tc >= a) & (tc < b) & np.isfinite(Mb) & (Mb > -70)
        p10 = float(np.percentile(Mv[k] - Mb[k], 10)) if k.sum() > 5 else float("nan")
        med = float(np.median(Mv[k] - Mb[k])) if k.sum() > 5 else float("nan")
        rows.append((name, a, b, Lv, Lm, Ls, Lb, Lv - Lb, p10, med))
    return rows


def ffmpeg_ebur(path):
    try:
        r = subprocess.run(
            ["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
            capture_output=True,
            text=True,
            timeout=300,
        )
        txt = r.stderr
        i = txt.rfind("Summary:")
        if i < 0:
            return txt[-1500:]
        out = []
        for line in txt[i:].splitlines():
            out.append(line.rstrip())
            if line.strip().startswith("Peak:"):
                break
        return chr(10).join(l for l in out if l)
    except Exception as e:
        return f"ffmpeg check failed: {e}"


def write_cues(C, b, st_, rows, eb, v_ref, G):
    vI = v_ref + G
    L = []
    w = L.append
    w(f"# {os.path.basename(ROOT)} - soundtrack cue sheet")
    w("")
    w(f"- Integrated **{st_['I']:.1f} LUFS**, true peak **{st_['TP']:.1f} dBTP**, LRA {st_['LRA']:.1f} LU")
    w(f"- Stems: voice {st_['voice_I']:.1f} LUFS, music {st_['music_I']:.1f} LUFS, sfx {st_['sfx_I']:.1f} LUFS (gain {G:+.2f} dB)")
    w("")
    w("```")
    w(eb)
    w("```")
    w("")
    w("| section (shots) | time s | voice | music | sfx | bed | margin LU | speech median LU | speech p10 LU |")
    w("|---|---|---|---|---|---|---|---|---|")
    for r in rows:
        fmt = lambda x: "-" if x <= -98 else f"{x:.1f}"
        w(f"| {r[0]} | {r[1]:.2f}-{r[2]:.2f} | {fmt(r[3])} | {fmt(r[4])} | {fmt(r[5])} | {fmt(r[6])} | {r[7]:.1f} | {r[9]:.1f} | {r[8]:.1f} |")
    w("")
    with open(os.path.join(AUDIO_DIR, "cues.md"), "w", encoding="utf-8") as fp:
        fp.write("\n".join(L))


def main():
    t_start = time.time()
    words = T.words(os.path.join(ROOT, "voice", "words.json"))
    spans = speech_spans(words)
    v = load_voice()
    v_ref = integrated(v)
    log(f"voice: {v_ref:.2f} LUFS, TP {true_peak(v):.2f} dBTP")

    import music

    b = music.build()
    m_raw = cached("music_raw", lambda: music.render(b, ref=-20.0)[0])
    log("music rendered", f"{lufs(m_raw):.2f} LUFS raw")
    dk = duck_db(spans)
    m_d = m_raw * dbg(dk)[None, :]
    sec_curve, sec_gains = section_db(m_d, v)
    m = m_d * dbg(sec_curve)[None, :]
    end = ns(T.DUR - 0.03)
    m[:, end:] *= np.linspace(1, 0, N - end)[None, :]

    import sfx

    C_holder = {}

    def _s():
        out, C = sfx.render(v_ref)
        C_holder["C"] = C
        return out

    s_st = cached("sfx", _s)
    if "C" not in C_holder:
        C_holder["C"] = sfx.cues()
        for c in C_holder["C"]:
            c.measured = None
    C = C_holder["C"]
    log("sfx rendered", f"{lufs(s_st):.2f} LUFS")

    mix0 = v + m + s_st
    G = TARGET_LUFS - lufs(mix0)
    for it in range(5):
        y, g3 = limiter(mix0 * dbg(G))
        L = lufs(y)
        log(f"master iter {it}: gain {G:+.2f} dB -> {L:.2f} LUFS, TP {true_peak(y):.2f} dBTP")
        if abs(L - TARGET_LUFS) < 0.02:
            break
        G += TARGET_LUFS - L
    y = fades(y, 0.0, 0.03)
    assert y.shape == (2, N)

    os.makedirs(AUDIO_DIR, exist_ok=True)
    gv, gm, gs = v * dbg(G), m * dbg(G), s_st * dbg(G)
    mix_path = os.path.join(AUDIO_DIR, "mix.wav")
    write_wav(mix_path, y)
    write_wav(os.path.join(AUDIO_DIR, "stem_voice.wav"), gv)
    write_wav(os.path.join(AUDIO_DIR, "stem_music.wav"), gm)
    write_wav(os.path.join(AUDIO_DIR, "stem_sfx.wav"), gs)

    I, TP, LRA = lufs(y), true_peak(y), lra(y)
    rows = section_table(gv, gm, gs, words)
    eb = ffmpeg_ebur(mix_path)
    stats = dict(I=I, TP=TP, LRA=LRA, G=G, voice_I=lufs(gv), music_I=lufs(gm), sfx_I=lufs(gs), sec_gains=sec_gains)
    print(eb)
    write_cues(C, b, stats, rows, eb, v_ref, G)

    if _args.clean_cache and os.path.isdir(CACHE):
        shutil.rmtree(CACHE, ignore_errors=True)
        log("cleaned audio _cache/")
    log(f"done in {time.time() - t_start:.0f} s")


if __name__ == "__main__":
    main()
