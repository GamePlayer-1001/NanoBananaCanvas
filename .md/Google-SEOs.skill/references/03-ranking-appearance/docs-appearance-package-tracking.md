---

---
source: https://developers.google.com/search/docs/appearance/package-tracking
---

# “包裹跟踪”功能尝鲜者计划

- 

# “包裹跟踪”功能尝鲜者计划

“包裹跟踪”是一项在 Google 上显示包裹跟踪相关信息的功能。借助此功能，当用户想要通过 Google 搜索跟踪由贵公司运输的包裹时，只需直接输入包裹编号即可。该功能会使用您的 API 检索包裹跟踪信息，然后将其显示给用户。下方展示了当用户试图跟踪某个包裹时，他们可能会在 Google 搜索上看到的包裹跟踪信息画面。

## 功能可用性

“包裹跟踪”功能适用于 Google 搜索支持的所有语言及国家/地区。

## 要求

如需申请加入“包裹跟踪”功能尝鲜者计划，您必须满足以下要求：

- 您的包裹配送公司必须位于印度、日本或巴西境外，或者是服务于这些地区的某家包裹配送公司的唯一包裹跟踪信息授权提供方。
- Google“包裹跟踪”功能会实时调用 RESTful JSON API（仅限 POST 请求），以检索包裹跟踪信息。如果您已经有可以返回此类信息的 API，我们可以帮助您重复利用该 API。您的 API 必须符合可用性和响应性要求，并提供必要内容。

### 可用性和响应性

我们希望您的 API 几乎不会停机，并要求 API 的平均响应时间不超过 700 毫秒，95% 以上的响应不超过 1,000 毫秒。如果您的 API 不符合上述要求，我们可能会停止显示您的包裹跟踪信息。

### 内容

为了使集成功能正常运行，您的 API 必须返回以下信息：

```
CurrentStatus
```

此外，我们强烈建议您让 API 返回以下信息：

```
DeliveredDate
```

```
PromisedDate
```

```
TrackingNumber
```

```
TrackingURL
```

```
SupportPhoneNumbers
```

```
TransitEvents
```

```
CreateDate
```

```
PickupDate
```

```
TimestampEvent
```

```
LocationEvent
```

```
CanReschedule
```

我们不接受以下信息：

- 包裹收件人或发件人的任何个人数据。
- 包裹收件人或发件人的任何地理位置信息。

## 填写申请表单

想要加入“包裹跟踪”功能尝鲜者计划？请填写此表单。