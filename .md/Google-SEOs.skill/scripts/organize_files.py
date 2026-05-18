#!/usr/bin/env python3
"""Google SEO文档分类脚本"""

import shutil
import os
from pathlib import Path

SOURCE_DIR = Path("/Users/zlbigger-mini/Documents/Obsidian Vault/Google官方seo指南/")
TARGET_BASE = Path("/Users/zlbigger-mini/.openclaw/workspace/skills/google-seo-expert/references/")

# 文件分类映射
CATEGORIES = {
    "01-fundamentals": [
        "seo-starter-guide", "how-search-works", "creating-helpful-content",
        "do-i-need-seo", "get-on-google", "intro", "get-started",
        "get-started-developers", "overview", "using-gen-ai-content",
        "docs-fundamentals-seo-starter-guide", "docs-fundamentals-how-search-works",
        "docs-fundamentals-creating-helpful-content", "docs-fundamentals-do-i-need-seo",
        "docs-fundamentals-get-on-google", "docs-fundamentals-get-started-developers",
        "docs-fundamentals-get-started", "docs-fundamentals-using-gen-ai-content",
        "case-studies", "case-studies-overview"
    ],
    "02-crawling-indexing": [
        "301-redirects", "consolidate-duplicate-urls", "sitemaps-overview",
        "robots-meta-tag", "robots-intro", "links-crawlable",
        "site-move-with-url-changes", "mobile-sites-mobile-first-indexing",
        "amp", "javascript-seo-basics", "block-indexing",
        "crawling-managing-faceted-navigation", "http-network-errors",
        "indexable-file-types", "large-site-managing-crawl-budget",
        "ask-google-to-recrawl", "control-what-you-share",
        "keep-redacted-information-out", "pause-online-business",
        "prevent-images-on-your-page", "qualify-outbound-links",
        "remove-information", "special-tags", "url-structure",
        "valid-page-metadata", "website-testing", "overview-google-crawlers",
        "docs-crawling-indexing-"
    ],
    "03-ranking-appearance": [
        "title-link", "snippet", "google-images", "video", "docs-appearance-video",
        "favicon-in-search", "featured-snippets", "site-names", "sitelinks",
        "ai-features", "google-discover", "enriched-search-results",
        "flexible-sampling", "package-tracking", "preferred-sources",
        "publication-dates", "top-places-list", "translated-results",
        "enable-web-stories", "establish-business-details",
        "visual-elements-gallery", "docs-appearance-"
    ],
    "04-structured-data": [
        "intro-structured-data", "article", "breadcrumb", "carousel",
        "carousels-beta", "course", "dataset", "discussion-forum",
        "education-qa", "employer-rating", "event", "faqpage",
        "generate-structured-data-with-javascript", "image-license-metadata",
        "job-posting", "local-business", "loyalty-program", "math-solvers",
        "merchant-listing", "movie", "organization", "paywalled-content",
        "practice-problems", "product", "product-snippet", "product-variants",
        "profile-page", "qapage", "recipe", "return-policy", "review-snippet",
        "sd-policies", "search-gallery", "shipping-policy", "software-app",
        "speakable", "vacation-rental", "docs-appearance-structured-data-"
    ],
    "05-monitoring-debugging": [
        "search-operators", "debugging-search-traffic-drops",
        "google-analytics-search-console", "trends-start",
        "bubble-chart-analysis", "docs-monitor-debug-",
        "help", "help-office-hours", "help-report-quality-issues",
        "office-hours", "report-quality-issues",
        "spam-policies", "technical", "docs-essentials-"
    ]
}

def get_category(filename):
    """根据文件名判断分类"""
    name = filename.replace('.md', '')
    
    # 按优先级检查（优先匹配更具体的）
    for cat, prefixes in CATEGORIES.items():
        for prefix in prefixes:
            if name.startswith(prefix) or name == prefix:
                return cat
    
    # 默认分类
    return "06-specialty"

def main():
    stats = {cat: 0 for cat in list(CATEGORIES.keys()) + ["06-specialty"]}
    
    # 遍历所有md文件
    for file_path in SOURCE_DIR.glob("*.md"):
        if file_path.name == "docs.md":
            continue  # 跳过主索引文件
            
        category = get_category(file_path.name)
        target_dir = TARGET_BASE / category
        target_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            shutil.copy2(file_path, target_dir / file_path.name)
            stats[category] += 1
            print(f"✓ {file_path.name} → {category}")
        except Exception as e:
            print(f"✗ {file_path.name}: {e}")
    
    print("\n" + "="*50)
    print("分类统计:")
    for cat, count in sorted(stats.items()):
        print(f"  {cat}: {count} 个文件")
    print(f"  总计: {sum(stats.values())} 个文件")

if __name__ == "__main__":
    main()
