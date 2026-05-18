#!/usr/bin/env python3
"""清理06-specialty目录，移除已被分类的文件"""

import os
from pathlib import Path

BASE_DIR = Path("/Users/zlbigger-mini/.openclaw/workspace/skills/google-seo-expert/references")
SPECIALTY_DIR = BASE_DIR / "06-specialty"

def main():
    # 获取其他所有分类中的文件名
    categorized_files = set()
    for category_dir in BASE_DIR.iterdir():
        if category_dir.is_dir() and category_dir.name not in ["06-specialty", "07-patterns"]:
            for f in category_dir.glob("*.md"):
                categorized_files.add(f.name)
    
    print(f"其他分类中的文件数: {len(categorized_files)}")
    
    # 删除06-specialty中已分类的文件
    removed = 0
    kept = 0
    for f in SPECIALTY_DIR.glob("*.md"):
        if f.name in categorized_files:
            f.unlink()
            removed += 1
        else:
            kept += 1
    
    print(f"已删除重复文件: {removed}")
    print(f"保留文件: {kept}")
    
    # 如果06-specialty为空，删除它
    remaining = list(SPECIALTY_DIR.glob("*.md"))
    if not remaining:
        SPECIALTY_DIR.rmdir()
        print("06-specialty目录已删除（为空）")
    else:
        print(f"06-specialty保留文件: {len(remaining)}")
        for f in remaining[:10]:
            print(f"  - {f.name}")
        if len(remaining) > 10:
            print(f"  ... 还有 {len(remaining) - 10} 个文件")

if __name__ == "__main__":
    main()
