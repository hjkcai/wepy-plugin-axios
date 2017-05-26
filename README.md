# wepy-plugin-axios

> 🎉 首先感谢 axios 和 wepy 的作者提供了这么赞的库！

这是一个能够让你在小程序中使用 axios 的 wepy 插件

[axios文档](https://github.com/mzabriskie/axios) |
[wepy文档](https://github.com/wepyjs/wepy)

在制作小程序的时候，小程序内置的 `wx.request` 函数功能严重受限.
即使是 `wepy.request` 也只是对原来的函数进行简单的封装, 并不能提供像 axios
类似的高级功能. 所以我制作了这个插件来让小程序中可以使用 axios 的大部分功能.

在保持 API 尽可能贴近 axios 原始 API 的情况下, 本插件对 `wx.request`,
`wx.uploadFile`, `wx.downloadFile` 进行了封装. 同时提供了请求队列功能,
解除了最多同时只发送5个请求的限制.

喜欢就给个 Star 支持一下吧😏 欢迎开 issue 和 PR

## 安装

使用 npm 或 yarn 同时安装 axios 和 wepy-plugin-axios

```bash
npm install axios wepy-plugin-axios --save
yarn add axios wepy-plugin-axios
```

## 配置

> 注意: **本插件必须配合 wepy 使用**. 下面的例子使用的均为最新版本的 wepy.
> 如果你还不会用 wepy 或 axios, 请先阅读它们各自的文档

1. 配置 wepy

    在 `wepy.config.js` 的 `plugins` 中加入 `axios` 项.
    插件没有选项,使用空对象作为选项即可

    ```js
    module.exports = {
      // ...其它配置
      plugins: {
        // ...其它插件
        axios: {}
      }
    }
    ```

    注意: 如果你使用的是 wepy 生成的默认配置, 在文件的最后面有下面这样的代码:

    ```js
    module.exports.plugin = {
      uglifyjs: {
        // ...
      },
      imagemin: {
        // ...
      }
    }
    ```

    在这里也同样要插入一行 `axios: {}`, 否则在生成发布版本时将产生错误

2. 配置 axios

    **从 `wepy-plugin-axios/dist/adapter` 处引入一个用于生成 adapter 的函数,
    然后向这个函数传入 axios 的实例即可得到一个 adapter**

    利用 `axios.defaults` 或 `axios.create` 来设置 axios 的 `adapter` 属性 (推荐后者)

    ```js
    import axios from 'axios'
    import wepyAxiosAdapter from 'wepy-plugin-axios/dist/adapter'

    // adapter 的初始化一定要在任何其它的 axios.create 之前执行
    const adapter = wepyAxiosAdapter(axios)

    export default axios.create({
      adapter: adapter      // 此属性为可以在小程序中使用 axios 的关键
      // ...其它属性
    })
    ```

## 用法

下面的例子假定已经根据上面的内容配置完毕

### 发送普通请求

```js
// 发送普通 GET 请求
axios.get('https://huajingkun.com/api/userinfo')

// 发送 json 数据
axios.request({
  method: 'post',
  url: 'https://huajingkun.com/api/userinfo',
  data: {
    nickname: '233'
  }
})

// 发送 urlencoded 数据
axios.post('https://huajingkun.com/api/userinfo', { nickname: '233' }, {
  headers: {
    'content-type': 'application/x-www-form-urlencoded'
  }
})
```

### 上传文件

如果在 POST 请求的数据中出现了 `$upload` 字段，则将此请求视为上传文件请求

```js
axios.post('https://huajingkun.com/api/avatar', {
  $upload: {
    name: 'avatar',
    filePath: 'wxfile://sometempfilepath'     // 来自 wx.chooseImage 等接口的结果
  },
  // ...其它一起发送的数据
})
```

### 下载文件

如果在一个 GET 请求中 `responseType` 为 `file`, 则将此请求视为下载文件请求.
返回**文件的临时路径** (详见[小程序开发文档](https://mp.weixin.qq.com/debug/wxadoc/dev/api/network-file.html#wxdownloadfileobject))

注意: 只有此时可以使用 http 协议

```js
axios.get('http://www.baidu.com', { responseType: 'file' }).then(response => {
  console.log(response.data)    // 输出下载成功的文件的临时路径
})
```

## 请求选项

本插件提供了大部分 axios 选项的支持, 同时在原有的 axios API 的基础上进行了一些修改:

### 不支持的选项

注：由于小程序的请求功能有限, 所以不支持以下选项.
如果使用时出现了以下选项, 将直接忽略.
不在此列表中的功能均可使用

* `timeout`
* `withCredentials`
* `auth`
* `xsrfCookieName`
* `xsrfHeaderName`
* `onUploadProgress`
* `onDownloadProgress`
* `maxContentLength`
* `maxRedirects`
* `httpAgent`
* `httpsAgent`
* `proxy`

### 受限的选项

* `url`: 必须指定协议, 并且只能是 http 或 https. 只有下载文件可以用 http
* `method`: 只能是小程序支持的方法 (详见[小程序开发文档](https://mp.weixin.qq.com/debug/wxadoc/dev/api/network-request.html))
* `responseType`: 只能是 `json`, `text`, `file` 中的一个

## 返回内容

返回内容与 axios 返回内容相似:

```js
{
  // 服务器发回的响应数据
  // 对于下载文件请求, data 字段的内容为文件的临时路径
  data: object | string | any,

  // HTTP 响应码
  status: number,

  // 服务器返回的 HTTP 头部. 所有的头部名称都为小写
  // 对于上传或下载请求, headers 字段始终为空对象 (小程序没有提供返回的头部内容)
  headers: object,

  // axios 所使用的请求选项
  config: object,

  // 传入 wx.request 或 wx.uploadFile 或 wx.downloadFile 的具体内容
  request: object
}
```

## 注意

由于目前 wepy 的插件系统还不够完善, 所以本插件使用了比较“脏”的方法来让 axios
可以在 wepy 中使用:

**直接修改 axios 源文件**

在 `lib/plugin.js` 中删除了 axios 源文件 `lib/defaults.js` 中有关 adapters 的定义.
由于 axios 是同时支持浏览器和 Node.js 的, 但 wepy 在打包时无法忽略 Node.js
的原生模块, 所以会导致打包失败

但 wepy 的插件目前只能在打包的最后一步中对源文件进行修改, 不能修改依赖关系信息,
也就无法忽略为 Node.js 准备的代码, 所以只能粗暴地删除它. 浏览器断的代码也顺便删除了,
因为小程序中不能使用 `XMLHttpRequest`, 必须完全使用自定义的 adapter,
删除后还可以减小文件体积

这样的修改意味着, 如果你的小程序代码和其它代码共用一个 `node_modules` 文件夹的话,
其它代码将无法正常使用 axios

## 插件开发与测试

由于目前 wepy 没有 alias 功能, 开发时只能将整个项目文件夹复制到测试项目的
`node_modules` 文件夹下, 并将 `wepy-plugin-axios/dist/adapter` 改为
`wepy-plugin-axios/lib/adapter.js`

编译时运行以下命令即可在 `dist` 文件夹得到最终文件:

```bash
npm run build
```

## 许可
MIT
