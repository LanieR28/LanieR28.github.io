"""Melodiniq ULTIMA (music2999, 2999_04.c2s) -> Sonolus LevelData (.json) for MikuMikuWorld4UC.
Fast first version, nothing checked (user 10-04): port_v2 rules for the playable notes, plus
 - every CHUNITHM air line (ALD / ASD / ASC) as a 0.1-lane guide in its own colour, no fade,
 - out-of-field notes (cells < 0 or > 16) kept outside the 12 lanes (16 cells -> 12 lanes),
 - MNE as damage notes, SLP as time scale changes.
LevelData because only the UC format carries 8 guide colours and fractional lanes."""
import json, pickle
from pathlib import Path
import port_v2 as V, export_sus as X

import os
SRC = Path(os.environ.get("MELO_SRC", r"D:\data\A000\music\music2999\2999_04.c2s"))
OUT_DIR = Path(os.environ.get("MELO_OUT", r"C:\Users\東雲LanieR\Downloads\PJSK模型试写谱-0927\11-Melodiniq（ULTIMA 移植）"))
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT = OUT_DIR / "Melodiniq-ULTIMA移植.json"
SCALE = 12 / 16
RAIL_W = 0.1      # width of an edge rail line
RAIL_GAP = 0.2    # gap between neighbouring rails, and between the field edge and the first rail
PORT_CACHE = Path(__file__).with_name("_melo_port.pkl")

if PORT_CACHE.exists():
    ch, bpms = pickle.load(open(PORT_CACHE, "rb"))
else:
    ch, bpms = V.port(SRC)
    pickle.dump((ch, bpms), open(PORT_CACHE, "wb"))

rows = [l.split("\t") for l in SRC.read_text(encoding="utf-8", errors="replace").splitlines()]
beat_of = lambda m, o: (int(m) * 384 + int(o)) / 96

# original widths of notes, to put out-of-field notes back where they were
WIDTH = {}
for f in rows:
    if f[0] in ("TAP", "CHR", "FLK", "HLD", "HXD", "SLD", "SXD", "AIR", "AUL", "AUR", "AHD", "ADW", "ADL", "ADR", "MNE"):
        WIDTH[(round(beat_of(f[1], f[2]) * 96), int(f[3]))] = int(f[4])

def unclip(n):
    cell = n.get("_cell")
    if cell is None:
        return
    w = WIDTH.get((round(n["beat"] * 96), cell))
    if w is None:
        return
    if cell < 0:
        n["lane"] = cell * SCALE - 6 + n["size"]
    elif cell + w > 16:
        n["lane"] = (cell + w) * SCALE - 6 - n["size"]

# ---- stacked Ex slides (user 10-04): SXD rows sharing start and length, ending 1 cell wide, are N separate
# holds. The port merges parallel slides into one gesture (8 -> 4); here each row keeps its own hold, heads
# stacked at the start, tails spread 1 lane wide per row and packed against the field edge (left cells
# 0..3 -> -5.5..-2.5, right cells 12..15 -> 2.5..5.5). A CHUNITHM flick at the end becomes the tail flick
# of the nearest hold, as the port does for a single slide.
def spread_stacked_slides(ch):
    stacks = {}
    for f in rows:
        if f[0] == "SXD" and int(f[7]) == 1 and len(f) >= 9:
            stacks.setdefault((f[1], f[2], f[3], f[4], f[5]), []).append(int(f[6]))
    flk = {}
    for f in rows:
        if f[0] == "FLK":
            flk.setdefault(round(beat_of(f[1], f[2]) * 96), []).append((int(f[3]), int(f[4]), f[5]))
    for (m, o, c0, w0, dur), ends in stacks.items():
        if len(ends) < 3:
            continue
        t0 = beat_of(m, o); t1 = t0 + int(dur) / 96
        lane0, size0 = (int(c0) + int(w0) / 2) * SCALE - 6, int(w0) * SCALE / 2
        old = [c for c in ch if c[0]["arche"].endswith("HiddenHeadNote") and abs(c[0]["beat"] - t0) < 0.05
               and abs(c[-1]["beat"] - t1) < 0.05]
        if not old:
            continue
        head_arche = old[0][0]["arche"]
        ch = [c for c in ch if not any(c is o_ for o_ in old)]
        pos = lambda cell: -6 + cell + 0.5 if cell < 8 else cell - 9.5
        ends = sorted(ends)
        flicks = flk.get(round(t1 * 96), [])
        # nearest hold end for each flick
        owner = {}
        for fc, fw, _d in flicks:
            owner[min(ends, key=lambda e: abs(e + 0.5 - (fc + fw / 2)))] = (fc, fw)
        for i, e in enumerate(ends):
            head = dict(arche=head_arche, beat=t0 + 0.002 * (i + 1), lane=lane0, size=size0, direction=0, ease=1)
            tail = dict(arche="NormalTailTraceNote", beat=t1, lane=pos(e), size=0.5, direction=0, ease=1)
            if e in owner:
                fc, fw = owner[e]
                fx = (fc + fw / 2) * SCALE - 6
                tail.update(arche="NormalTailFlickNote", direction=0 if abs(fx - tail["lane"]) < 0.5 else (2 if fx > tail["lane"] else 1))
            ch.append([head, tail])
    return ch

ch = spread_stacked_slides(ch)

# ---- playable notes from the port (its own decoration guides are replaced by the coloured lines)
chains = []
for c in ch:
    if c[0]["arche"] == "Guide" and any(n.get("_deco") for n in c):
        continue
    for n in c:
        unclip(n)
    chains.append(c)

# ---- air lines -> coloured thin guides
COLOR = {"RED": 102, "GRN": 103, "DEF": 103, "AQA": 107, "YEL": 105, "PPL": 106, "VLT": 104, "GRY": 101, "BLK": 108}
pieces = []
for f in rows:
    if f[0] in ("ALD", "ASD", "ASC") and len(f) >= 12:
        col = f[11].strip()
        if col == "NON" or col not in COLOR:
            continue
        t0 = beat_of(f[1], f[2]); t1 = t0 + int(f[7]) / 96
        x0 = (int(f[3]) + int(f[4]) / 2) * SCALE - 6; x1 = (int(f[8]) + int(f[9]) / 2) * SCALE - 6
        if t1 <= t0:
            continue
        # an ALD hugging the left/right edge cell for its whole length is a "rail" (user 10-04):
        # it lives outside the 12 lanes; rails alive at the same time on one side stack outward in
        # order of appearance (earlier ones keep their place), RAIL_GAP apart, not at the CHUNI spacing
        side = None
        if f[0] == "ALD" and int(f[3]) == int(f[8]) and int(f[4]) == int(f[9]) == 1:
            side = {0: -1, 15: 1}.get(int(f[3]))
        pieces.append([t0, x0, t1, x1, COLOR[col], f[0] == "ASC", side])
pieces.sort(key=lambda p: p[:6])
for side in (-1, 1):
    live = []                                    # (end, slot) of rails still on screen
    for p in pieces:
        if p[6] != side:
            continue
        live = [(e, s) for e, s in live if e > p[0] + 1e-9]
        slot = min(set(range(len(live) + 1)) - {s for e, s in live})
        live.append((p[2], slot))
        p[1] = p[3] = side * (6 + RAIL_GAP + RAIL_W / 2 + slot * (RAIL_W + RAIL_GAP))
used = [False] * len(pieces)
by_start = {}
for i, p in enumerate(pieces):
    by_start.setdefault((round(p[0] * 96), round(p[1] * 64), p[4]), []).append(i)
lines = []
for i, p in enumerate(pieces):
    if used[i]:
        continue
    used[i] = True; line = [p]
    while True:
        last = line[-1]
        nxt = [j for j in by_start.get((round(last[2] * 96), round(last[3] * 64), last[4]), []) if not used[j]]
        if not nxt:
            break
        used[nxt[0]] = True; line.append(pieces[nxt[0]])
    lines.append(line)

# ---- LevelData
ents, names = [], [0]
def name():
    names[0] += 1
    return "e%x" % names[0]
ents.append({"archetype": "Initialization", "data": []})
for b, v in bpms:
    ents.append({"archetype": "#BPM_CHANGE", "data": [{"name": "#BEAT", "value": b}, {"name": "#BPM", "value": v}]})

# ---- scroll speed layers (CHUNITHM SLP: measure, offset, duration, speed, layer; SLA: measure, offset,
#      cell, width, duration, layer = the area whose objects follow that layer)
slp = {}
for f in rows:
    if f[0] == "SLP":
        t = int(f[1]) * 384 + int(f[2]); slp.setdefault(int(f[5]) if len(f) > 5 else 0, []).append((t, t + int(f[3]), float(f[4])))
SLA = []
for f in rows:
    if f[0] == "SLA":
        t = int(f[1]) * 384 + int(f[2]); SLA.append((t, t + int(f[5]), int(f[3]), int(f[3]) + int(f[4]), int(f[6])))

def speed_at(events, t, base):
    """the SLP covering tick t that started last wins; none -> base"""
    cur = None
    for a, b, v in events:
        if a <= t < b and (cur is None or a >= cur[0]):
            cur = (a, v)
    return cur[1] if cur else base

def layer_changes(layer):
    ev0 = slp.get(0, []); evl = slp.get(layer, []) if layer else []
    cuts = sorted({0} | {a for a, b, v in ev0 + evl} | {b for a, b, v in ev0 + evl})
    out, last = [], None
    for t in cuts:
        v = speed_at(ev0, t, 1.0)
        if layer:
            v = speed_at(evl, t, v)
        if v != last:
            out.append((t / 96, v)); last = v
    return out

layers = sorted(set([0] + [l for l in slp] + [a[4] for a in SLA]))
speeds = []
for layer in layers:
    gname = "g%d" % layer
    group = {"name": gname, "archetype": "#TIMESCALE_GROUP", "data": [{"name": "forceNoteSpeed", "value": 0}]}
    ents.append(group)
    prev = None
    for beat, v in layer_changes(layer):
        e = {"name": name(), "archetype": "#TIMESCALE_CHANGE",
             "data": [{"name": "#BEAT", "value": beat}, {"name": "#TIMESCALE", "value": v},
                      {"name": "#TIMESCALE_SKIP", "value": 0}, {"name": "#TIMESCALE_EASE", "value": 0},
                      {"name": "#TIMESCALE_GROUP", "ref": gname}]}
        if prev is None:
            group["data"].append({"name": "first", "ref": e["name"]})
        else:
            prev["data"].append({"name": "next", "ref": e["name"]})
        ents.append(e); prev = e; speeds.append((layer, beat, v))

def group_of(beat, lane):
    """objects inside an SLA area (time x cells) follow that area's layer"""
    t = beat * 96; cell = (lane + 6) / SCALE
    for a, b, c0, c1, layer in SLA:
        if a <= t <= b and c0 <= cell <= c1:
            return "g%d" % layer
    return "g0"

def note_data(n, extra=()):
    d = [{"name": "#BEAT", "value": n["beat"]}, {"name": "lane", "value": n["lane"]},
         {"name": "size", "value": max(n["size"], 0.05)}, {"name": "direction", "value": int(n.get("direction", 0) or 0)},
         {"name": "#TIMESCALE_GROUP", "ref": group_of(n["beat"], n["lane"])}]
    return d + list(extra)

def single_arche(a):
    return a if a.endswith("Note") else "NormalTapNote"

def hold_arche(n, first, last, guide):
    a = n["arche"]
    if guide or a == "AnchorNote" or "Hidden" in a or (last and n.get("hidden_end")):
        return "AnchorNote"
    if "Tick" in a:
        return ("Critical" if "Critical" in a else "Normal") + "TickNote"
    return a

n_single = n_hold = 0
for c in chains:
    a0 = c[0]["arche"]
    if len(c) == 1:
        ents.append({"archetype": single_arche(a0), "data": note_data(c[0])}); n_single += 1
        continue
    guide = a0 == "Guide"
    crit = "Critical" in a0 or bool(c[0].get("_crit"))
    kind = (105 if crit else 103) if guide else (2 if crit else 1)
    nodes = [{"name": name()} for _ in c]
    # attached ticks (size 0) lie on the curve
    for i, n in enumerate(c):
        extra = [{"name": "isAttached", "value": 1 if n["size"] <= 0 else 0},
                 {"name": "isSeparator", "value": 1 if i == 0 else 0},
                 {"name": "connectorEase", "value": int(n.get("ease", 1) or 1)},
                 {"name": "segmentKind", "value": kind}, {"name": "segmentAlpha", "value": 1},
                 {"name": "segmentLayer", "value": 0}]
        if i + 1 < len(c):
            extra.append({"name": "next", "ref": nodes[i + 1]["name"]})
        nodes[i].update({"archetype": hold_arche(n, i == 0, i + 1 == len(c), guide), "data": note_data(n, extra)})
    ents.extend(nodes); n_hold += 1

def split_at_sla(pts):
    cuts = sorted({a / 96 for a, b, c0, c1, l in SLA} | {b / 96 for a, b, c0, c1, l in SLA})
    out = [pts[0]]
    for (t0, x0), (t1, x1) in zip(pts, pts[1:]):
        for c in cuts:
            if t0 < c < t1:
                out.append((c, x0 + (x1 - x0) * (c - t0) / (t1 - t0)))
        out.append((t1, x1))
    return out

for line in lines:
    pts = split_at_sla([(p[0], p[1]) for p in line] + [(line[-1][2], line[-1][3])])
    nodes = [{"name": name()} for _ in pts]
    for i, (t, x) in enumerate(pts):
        extra = [{"name": "isAttached", "value": 0}, {"name": "isSeparator", "value": 1 if i == 0 else 0},
                 {"name": "connectorEase", "value": 1}, {"name": "segmentKind", "value": line[0][4]},
                 {"name": "segmentAlpha", "value": 1}, {"name": "segmentLayer", "value": 1}]
        if i + 1 < len(pts):
            extra.append({"name": "next", "ref": nodes[i + 1]["name"]})
        nodes[i].update({"archetype": "AnchorNote", "data": note_data({"beat": t, "lane": x, "size": RAIL_W / 2}, extra)})
    ents.extend(nodes)

n_mne = 0
for f in rows:
    if f[0] == "MNE":
        cell, w = int(f[3]), int(f[4])
        size = w * SCALE / 2
        ents.append({"archetype": "DamageNote",
                     "data": note_data({"beat": beat_of(f[1], f[2]), "lane": cell * SCALE - 6 + size, "size": size})})
        n_mne += 1

OUT.write_text(json.dumps({"bgmOffset": 0, "entities": ents}, ensure_ascii=False), encoding="utf-8")
print("singles", n_single, "holds", n_hold, "air lines", len(lines), "damage", n_mne, "layers", layers, "speeds", speeds[:12], "->", OUT)
