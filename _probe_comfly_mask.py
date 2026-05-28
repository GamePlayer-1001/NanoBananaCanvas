"""
Comfly mask 探针：构造一张原图 + 一张带透明区域的 mask PNG，
调用 https://ai.comfly.chat/v1/images/edits，看 comfly 是否真的支持
OpenAI 标准的 mask 字段 (透明像素 = 重绘区域)。

非破坏性：只发请求、不写文件、不改任何代码。
"""

import io
import os
import sys
import json
from PIL import Image, ImageDraw
import requests

API_KEY = os.environ.get("COMFLY_API_KEY", "").strip()
if not API_KEY:
    print("[FATAL] COMFLY_API_KEY env var missing")
    sys.exit(2)

BASE_URL = "https://ai.comfly.chat/v1"
ENDPOINT = f"{BASE_URL}/images/edits"

# 1. 造一张 512x512 的纯色原图（左半红，右半蓝）
img = Image.new("RGBA", (512, 512), (255, 0, 0, 255))
ImageDraw.Draw(img).rectangle([(256, 0), (512, 512)], fill=(0, 0, 255, 255))
img_buf = io.BytesIO()
img.save(img_buf, format="PNG")
img_buf.seek(0)

# 2. 造蒙版：透明=要重绘，不透明=保留。中间一个透明圆 = 让模型只重绘圆内区域
mask = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
ImageDraw.Draw(mask).ellipse([(150, 150), (362, 362)], fill=(0, 0, 0, 0))
mask_buf = io.BytesIO()
mask.save(mask_buf, format="PNG")
mask_buf.seek(0)

PROMPT = "Replace the masked region with a yellow smiling sun, keep the rest unchanged"

# 候选模型（按文档/代码里能查到的图片模型逐个试）
MODELS = [
    "gpt-image-1",
    "gpt-image-2",
    "gpt-image-2-all",
    "dall-e-2",  # OpenAI 标准 edits 模型，作为基准
]

results = []

for model in MODELS:
    img_buf.seek(0)
    mask_buf.seek(0)
    files = {
        "image": ("image.png", img_buf.read(), "image/png"),
        "mask": ("mask.png", mask_buf.read(), "image/png"),
    }
    data = {
        "model": model,
        "prompt": PROMPT,
        "n": "1",
        "size": "512x512",
    }
    headers = {"Authorization": f"Bearer {API_KEY}"}
    print(f"\n=== model: {model} ===")
    try:
        resp = requests.post(ENDPOINT, headers=headers, data=data, files=files, timeout=120)
        status = resp.status_code
        ct = resp.headers.get("content-type", "")
        body = resp.text
        snippet = body if len(body) <= 800 else body[:800] + "...<truncated>"
        print(f"status={status} ct={ct}")
        print(f"body={snippet}")
        ok = False
        try:
            j = resp.json()
            if isinstance(j, dict) and j.get("data"):
                ok = True
        except Exception:
            pass
        results.append({"model": model, "status": status, "ok": ok, "snippet": snippet[:200]})
    except Exception as e:
        print(f"EXC {type(e).__name__}: {e}")
        results.append({"model": model, "status": -1, "ok": False, "snippet": str(e)[:200]})

print("\n\n=== SUMMARY ===")
for r in results:
    print(f"  {r['model']:24} status={r['status']:>4} ok={r['ok']}")
