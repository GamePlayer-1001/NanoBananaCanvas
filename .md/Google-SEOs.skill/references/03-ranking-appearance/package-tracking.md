# Google 上的“包裹跟踪”功能 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/package-tracking?hl=zh-cn

---

  # “包裹跟踪”功能尝鲜者计划

  “包裹跟踪”是一项在 Google 上显示包裹跟踪相关信息的功能。借助此功能，当用户想要通过 Google 搜索跟踪由贵公司运输的包裹时，只需直接输入包裹编号即可。该功能会使用您的 API 检索包裹跟踪信息，然后将其显示给用户。下方展示了当用户试图跟踪某个包裹时，他们可能会在 Google 搜索上看到的包裹跟踪信息画面。

      注意**：在 Google 搜索结果中的实际呈现效果可能会有不同。

## 
      功能可用性

      “包裹跟踪”功能适用于 Google 搜索支持的所有语言及国家/地区。

## 
      要求

  如需申请加入“包裹跟踪”功能尝鲜者计划，您必须满足以下要求：

- 您的包裹配送公司必须位于印度、日本或巴西境外，或者是服务于这些地区的某家包裹配送公司的唯一包裹跟踪信息授权提供方。
- Google“包裹跟踪”功能会实时调用 RESTful JSON API（仅限 POST 请求），以检索包裹跟踪信息。如果您已经有可以返回此类信息的 API，我们可以帮助您重复利用该 API。您的 API 必须符合[可用性和响应性要求](#availability)，并提供[必要内容](#content)。

### 可用性和响应性

      我们希望您的 API 几乎不会停机，并要求 API 的平均响应时间不超过 700 毫秒，95% 以上的响应不超过 1,000 毫秒。如果您的 API 不符合上述要求，我们可能会停止显示您的包裹跟踪信息。

### 内容

      为了使集成功能正常运行，您的 API 必须返回以下信息：

        必填字段

       CurrentStatus

       包裹的当前状态。这包括此状态生效的日期和时间，以及任何错误状态。

    此外，我们强烈建议您让 API 返回以下信息：

        建议字段

       DeliveredDate

       包裹的送达日期和时间（如果包裹已送达）。

       PromisedDate

       包裹的预计送达日期。

        TrackingNumber

       包裹的跟踪编号。

       TrackingURL

       用户可以在上面查看包裹跟踪信息和其他潜在详情的网站网址。

       SupportPhoneNumbers

       按地区列出可用的支持电话号码。

       TransitEvents

       表示包裹在送达收件人前的阶段性变动，包括日期、时间、城市、州和国家/地区（如果适用）。

       CreateDate

       跟踪编号的创建日期和时间。

       PickupDate

       运输公司揽收包裹的日期。

       TimestampEvent

       与指定包裹相关联的事件的时间戳。

       LocationEvent

       与指定包裹相关联的事件的地点。

       CanReschedule

       是否可以重新安排此包裹的运送时间。

      我们不接受以下信息：

- 包裹收件人或发件人的任何个人数据。
- 包裹收件人或发件人的任何地理位置信息。

## 
      填写申请表单

      想要加入“包裹跟踪”功能尝鲜者计划？请[填写此表单](https://docs.google.com/forms/d/e/1FAIpQLSeHkDALO5vJg1l4GaUkkBzxeqDtkJukJokBBOtbmlH9Vk9M_w/viewform?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。