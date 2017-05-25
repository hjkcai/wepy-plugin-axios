'use strict'

import settle from 'axios/lib/core/settle'
import buildURL from 'axios/lib/helpers/buildURL'
import createError from 'axios/lib/core/createError'

const supportedMethods = ['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'CONNECT']

export default function wxaAdapterFactory (axios) {
  return function wxaAdapter (config) {
    return new Promise((resolve, reject) => {
      // 必须使用 https
      if (config.url.slice(0, 5).toLowerCase() !== 'https') {
        reject(createError('Requesting an http URL is not allowed', config))
      }

      if (config.responseType && config.responseType !== 'json' && config.responseType !== 'text') {
        // 只接受 json 或 text 的返回类型
        reject(createError('responseType only supports "json" or "text"', config))
      } else if (config.responseType === 'text' && config.transformResponse[0] === axios.defaults.transformResponse[0]) {
        // axios 默认会尝试将文本转为 json
        // 这里保证返回类型为 text 时返回的一定是文本
        config.transformResponse = []
      }

      // 检查小程序是否支持所使用的 method
      config.method = config.method.toUpperCase()
      if (supportedMethods.indexOf(config.method) === -1) {
        reject(createError('Unsupported request method', config))
      }

      // 生成用于 wx.request 的参数
      const request = {
        method: config.method.toUpperCase(),
        url: buildURL(config.url, config.params, config.paramsSerializer),
        data: config.data,
        header: config.headers,
        dataType: config.responseType
      }

      wx.request({
        ...request,
        success: response => {
          // 按照 axios 的返回格式构造返回值
          settle(resolve, reject, {
            data: response.data,
            status: response.statusCode,
            headers: response.header,
            config,
            request
          })
        },
        fail: response => {
          let err = response.errMsg

          // 增加错误消息可读性
          if (err === 'request:fail') {
            err = 'Request failed'
          }

          reject(createError(err, config))
        }
      })
    })
  }
}
