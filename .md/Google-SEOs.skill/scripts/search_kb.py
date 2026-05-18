#!/usr/bin/env python3
"""
[INPUT]: 依赖 references/ 目录下的 Markdown 知识库文件，依赖 argparse/pathlib/concurrent.futures 提供搜索能力
[OUTPUT]: 对外提供知识库分类列举、关键词搜索、结果格式化输出能力
[POS]: scripts 模块的核心检索脚本，被 SKILL.md 指引用户直接调用
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""

import os
import sys
import re
import argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# 知识库根目录
KB_ROOT = Path(__file__).parent.parent / "references"

def get_all_markdown_files():
    """获取所有markdown文件"""
    files = []
    for category_dir in KB_ROOT.iterdir():
        if category_dir.is_dir():
            for md_file in category_dir.glob("*.md"):
                files.append((category_dir.name, md_file))
    return files

def search_file(category, file_path, keywords):
    """在单个文件中搜索关键词"""
    results = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            
            # 检查文件名是否匹配
            filename_match = any(kw.lower() in file_path.name.lower() for kw in keywords)
            
            # 搜索内容
            content_matches = []
            for i, line in enumerate(lines, 1):
                if any(kw.lower() in line.lower() for kw in keywords):
                    # 提取上下文
                    start = max(0, i - 2)
                    end = min(len(lines), i + 2)
                    context = '\n'.join(lines[start:end])
                    content_matches.append((i, context.strip()))
            
            if filename_match or content_matches:
                results.append({
                    'category': category,
                    'file': file_path.name,
                    'path': str(file_path.relative_to(KB_ROOT.parent)),
                    'filename_match': filename_match,
                    'content_matches': content_matches[:5]  # 最多5个匹配
                })
    except Exception as e:
        pass
    
    return results

def search_kb(keywords):
    """搜索知识库"""
    keywords = [kw.strip() for kw in keywords.split()]
    files = get_all_markdown_files()
    
    all_results = []
    
    # 并行搜索
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(search_file, cat, fp, keywords) for cat, fp in files]
        for future in as_completed(futures):
            result = future.result()
            if result:
                all_results.extend(result)
    
    # 排序：文件名匹配优先
    all_results.sort(key=lambda x: (not x['filename_match'], -len(x['content_matches'])))
    
    return all_results

def list_categories():
    """列出所有分类"""
    print("知识库分类结构:\n")
    for category_dir in sorted(KB_ROOT.iterdir()):
        if category_dir.is_dir():
            files = list(category_dir.glob("*.md"))
            print(f"  {category_dir.name}/ ({len(files)}个文件)")
            # 显示前5个文件
            for f in sorted(files)[:5]:
                print(f"    - {f.name}")
            if len(files) > 5:
                print(f"    ... 还有 {len(files) - 5} 个文件")
            print()

def print_results(results, keywords):
    """打印搜索结果"""
    if not results:
        print(f"未找到与 '{keywords}' 相关的文档")
        return
    
    print(f"搜索 '{keywords}' 找到 {len(results)} 个相关文档:\n")
    
    # 按分类分组
    by_category = {}
    for r in results:
        cat = r['category']
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(r)
    
    for category in sorted(by_category.keys()):
        print(f"[{category}]")
        for r in by_category[category][:5]:  # 每类最多显示5个
            match_icon = "*" if r['filename_match'] else "-"
            print(f"  {match_icon} {r['file']}")
            print(f"     路径: {r['path']}")
            
            if r['content_matches']:
                print("     匹配内容:")
                for line_num, context in r['content_matches'][:2]:
                    preview = context.replace('\n', ' | ')[:100]
                    print(f"       L{line_num}: {preview}...")
            print()

def main():
    parser = argparse.ArgumentParser(description='Google SEO Expert 知识库搜索')
    parser.add_argument('keywords', nargs='?', help='搜索关键词')
    parser.add_argument('--list', '-l', action='store_true', help='列出所有分类')
    parser.add_argument('--max', '-m', type=int, default=20, help='最大结果数')
    
    args = parser.parse_args()
    
    if args.list:
        list_categories()
        return
    
    if not args.keywords:
        print("请提供搜索关键词，或使用 --list 查看分类")
        print(f"\n示例:")
        print(f"  python3 {sys.argv[0]} \"canonical\"")
        print(f"  python3 {sys.argv[0]} \"structured data product\"")
        print(f"  python3 {sys.argv[0]} --list")
        sys.exit(1)
    
    results = search_kb(args.keywords)
    print_results(results[:args.max], args.keywords)

if __name__ == "__main__":
    main()
