# 重定向和 Google 搜索 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/301-redirects?hl=zh-cn

---

# 重定向和 Google 搜索

  重定向网址是将现有网址解析为不同网址的做法，相当于告知访问者和 Google 搜索某个网页有新的地址。重定向在以下情况下尤为有用：

- 您已将网站移至新网域，并且想尽可能顺畅地完成迁移。
- 用户可通过多个不同的网址访问您的网站。例如，如果用户可通过多种途径（如 https://example.com/home、 http://home.example.com 或 https://www.example.com）访问您的首页，那么您最好选择其中一个网址作为首选（[规范](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn#definition)）目标网址，并使用重定向将所有来自其他几个网址的流量转到该首选网址。
- 您正在合并两个网站，并且想确保指向旧网址的链接重定向至正确网页。
- 您移除了某个网页，并希望将用户转到新网页。

      如果您使用的是 Blogger 或 Shopify 等平台，该平台可能已内置重定向解决方案。请尝试搜索帮助文章（例如，搜索“Blogger 重定向”）。

## 重定向类型概览

  虽然用户通常无法区分不同类型的重定向，但 Google 搜索会将某些类型的重定向用作指示重定向目标应是规范网址的信号。选择哪种重定向方式，取决于您希望它生效多久，以及您想让 Google 搜索在结果中展示哪个页面：

- **永久重定向**：在搜索结果中显示新的重定向目标。
- **临时重定向**：在搜索结果中显示源网页。

  下表介绍了可供您设置永久重定向和临时重定向的各种方式，按能被 Google 正确解析的可能性排序（例如，服务器端重定向最有可能被 Google 正确解析）。请选择适用于您的情形和网站的重定向类型：

    重定向类型

    永久重定向

Googlebot 会遵循重定向，而索引系统会将其视为一个信号，表明重定向目标应是[规范网址](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn#definition)。

            如果您确定将来不会撤销相应的重定向设置，请使用永久重定向。

          HTTP 301 (moved permanently)

              设置[服务器端重定向](#serverside)。

          HTTP 308 (moved permanently)

          meta refresh（0 秒）

              设置 [meta refresh 重定向](#metarefresh)。

          HTTP 刷新（0 秒）

          JavaScript location

              设置 [JavaScript 重定向](#jslocation)。

      仅在您无法实施服务器端重定向或 meta refresh 重定向时，才使用 JavaScript 重定向。

          Crypto 重定向

              详细了解 [crypto 重定向](#cryptoredirects)。

      请勿依赖 crypto 重定向来告知搜索引擎您的内容已迁移，除非您别无选择。

    临时

        Googlebot 会遵循重定向，但索引系统不会将其视为一个信号，表明重定向目标应是规范网址。如果存在其他规范化信号，目标网页可能仍会被编入索引。

          HTTP 302 (found)

              设置[服务器端重定向](#serverside)。

          HTTP 303 (see other)

          HTTP 307 (temporary redirect)

          meta refresh（超过 0 秒）

              设置 [meta refresh 重定向](#metarefresh)。

          HTTP refresh（超过 0 秒）

## 服务器端重定向

  如需设置服务器端重定向，您需要访问服务器配置文件（例如 Apache 上的 .htaccess 文件），或使用服务器端脚本（例如 PHP 脚本）来设置重定向标头。您可以在服务器端创建永久重定向和临时重定向。

### 永久服务器端重定向

  如果您需要更改某个网页在搜索引擎结果中显示的网址，建议您尽可能使用永久服务器端重定向。这是确保将 Google 搜索和用户定向到正确网页的最佳方式。301 和 308 状态代码表示网页已永久地迁移到新位置。

### 临时服务器端重定向

  如果您只是想暂时将用户转到其他网页，请使用临时重定向。这样还可以确保 Google 不受重定向的影响，这可能有助于将旧网址保留在 Google 搜索结果中。例如，如果您的网站提供的某项服务暂时不可用，您可以设置临时重定向，将用户转到说明情况的网页，而不会影响搜索结果中的原始网址。

### 实施服务器端重定向

  服务器端重定向的实施取决于托管和服务器环境，或网站后端的脚本语言。

  如需使用 PHP 设置永久重定向，请使用 header() 函数。您必须先设置标头，然后才能向屏幕发送任何内容：

```
header('HTTP/1.1 301 Moved Permanently');
header('Location: https://www.example.com/newurl');
exit();
```

  同理，以下示例展示了如何使用 PHP 设置临时重定向：

```
header('HTTP/1.1 302 Found');
header('Location: https://www.example.com/newurl');
exit();
```

  如果您有权访问网络服务器配置文件，则可以自行编写重定向规则。请按照网络服务器指南中的说明操作：

- **Apache**：请参阅 [Apache.htaccess 教程](https://httpd.apache.org/docs/2.0/howto/htaccess.html)、[Apache 网址重写指南](https://httpd.apache.org/docs/2.0/misc/rewriteguide.html)以及 [Apache mod_alias 文档](https://httpd.apache.org/docs/current/mod/mod_alias.html)。
          例如，您可以使用 mod_alias 设置形式最简单的重定向：

```
# Permanent redirect:
Redirect permanent "/old" "https://example.com/new"

# Temporary redirect:
Redirect temp "/two-old" "https://example.com/two-new"
```

      对于更复杂的重定向，请使用 mod_rewrite。例如：

```
RewriteEngine on
# redirect the service page to a new page with a permanent redirect
RewriteRule   "^/service$"  "/about/service"  [R=301]

# redirect the service page to a new page with a temporary redirect
RewriteRule   "^/service$"  "/about/service"  [R]
```
- **NGINX**：请参阅 NGINX 博客上的[创建 NGINX 重写规则](https://www.nginx.com/blog/creating-nginx-rewrite-rules/)一文。与 Apache 一样，您可以通过多种方式创建重定向。例如：

```
location = /service {
# for a permanent redirect
return 301 $scheme://example.com/about/service

# for a temporary redirect
return 302 $scheme://example.com/about/service
}
```

      对于更复杂的重定向，请使用 rewrite 规则：

```
location = /service {
# for a permanent redirect
rewrite service?name=$1 ^service/offline/([a-z]+)/?$ permanent;

# for a temporary redirect
rewrite service?name=$1 ^service/offline/([a-z]+)/?$ redirect;
}
```
- 对于所有其他网络服务器，请与您的服务器管理员或托管商联系，或在您喜爱的搜索引擎中搜索指南（例如，搜索“LiteSpeed 重定向”）。

## meta refresh 及其 HTTP 等效项

  如果无法在您的平台上实施[服务器端重定向](#serverside)，那么 meta refresh 重定向或许是一种可行的替代方案。Google 会区分两种 meta refresh 重定向：

- **即时 meta refresh 重定向**：在浏览器加载网页时立即触发。Google 搜索会将即时 meta refresh 重定向解析为永久重定向。
- **延迟 meta refresh 重定向**：仅在网站所有者设置的任意秒数之后触发。Google 搜索会将延迟 meta refresh 重定向解析为临时重定向。

  请将 meta refresh 重定向置于 HTML 的 <head> 元素中，或置于含服务器端代码的 HTTP 标头中。例如，下面是 HTML 中 <head> 元素内的一个即时 meta refresh 重定向示例：

```
<!doctype html>
<html>
<head>
<meta http-equiv="refresh" content="0; url=https://example.com/newlocation">
<title>Example title</title>
<!--...-->
```

下面是一个 HTTP 标头等效项示例，您可以通过服务器端脚本注入该等效项：

```

HTTP/1.1 200 OK
Refresh: 0; url=https://www.example.com/newlocation
...
```

  如需创建延迟重定向（会被 Google 解析为临时重定向），请将 content 属性设置为重定向应延迟的秒数：

```
<!doctype html>
<html>
<head>
<meta http-equiv="refresh" content="5; url=https://example.com/newlocation">
<title>Example title</title>
<!--...-->
```

## JavaScript location 重定向

  网址抓取完毕后，Google 搜索会使用网页渲染服务解析并执行 JavaScript。

      仅在您无法实施服务器端重定向或 meta refresh 重定向时，才使用 JavaScript 重定向。虽然 Google 会尝试渲染 Googlebot 抓取到的每个网址，但可能会由于各种原因而渲染失败。这意味着，如果您设置了 JavaScript 重定向，但 Google 无法渲染相应内容，那么 Google 可能永远都无法看到该重定向。

  如需设置 JavaScript 重定向，请在 HTML 标头内的脚本块中将 location 属性设置为重定向目标网址。例如：

```
<!doctype html>
<html>
<head>
<script>
  window.location.href = "https://www.example.com/newlocation";
</script>
<title>Example title</title>
<!--...-->
```

## Crypto 重定向

  如果您无法采用任何其他重定向方法，仍应设法告知用户相应网页或其内容已迁移。实现此目的的最简单方法是添加指向新网页的链接并随附简短说明。例如：

<a href="https://newsite.example.com/newpage.html">我们搬家了！
    请在我们的新网站上查找相应内容！</a>
这有助于用户找到您的新网站，并且 Google 可能会将此重定向视为 crypto 重定向（就像尼斯湖水怪一样，它的存在可能有争议；并非所有搜索引擎都可能会将这种伪重定向识别为官方重定向）。

      请勿依赖 crypto 重定向来告知搜索引擎您的内容已迁移，除非您别无选择。在使用 crypto 重定向之前，请与托管服务提供商联系，获取其他类型重定向方面的帮助。

## 网址的备用版本

  当您重定向网址时，Google 会跟踪重定向来源（旧网址）和重定向目标（新网址）。其中一个网址是[规范网址](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn)，具体取决于重定向是临时重定向还是永久重定向等此类信号。另一个网址会成为规范网址的备用名称。**备用名称是规范网址的不同版本，用户可能会更加认可和信任此网址。当用户的查询暗示他们可能更信任旧网址时，备用名称可能会显示在搜索结果中。

  例如，如果您的网站[迁移到了新域名](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes?hl=zh-cn)，那么即使新网址已编入索引，Google 也很可能仍会偶尔在搜索结果中显示旧网址。这是正常现象，当用户习惯使用新域名时，备用名称将逐渐消失，而您无需执行任何操作。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。