'use strict'

/**
 * 将 headers 对象中的 key 都转为小写
 *
 * @param {object} headers 要转换的 headers 对象
 */
export function transformHeaders (headers) {
  if (headers == null) return {}

  const result = {}
  Object.keys(headers).forEach(key => {
    result[key.toLowerCase()] = result[key]
  })

  return result
}

/**
 * URL 编码
 *
 * @param {string} val 要编码的字符串
 */
export function encode (val) {
  return encodeURIComponent(val)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
}

/**
 * 拼接 URL 与参数
 *
 * @param {string} url 原 URL
 * @param {object} params 要拼接的参数
 * @param {Function} paramsSerializer 参数序列化方法
 */
export function buildURL (url, params, paramsSerializer) {
  if (!params) return url

  var serializedParams
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params)
  } else {
    var parts = []

    Object.keys(params).forEach(key => {
      var val = params[key]
      if (val == null) return

      if (Array.isArray(val)) {
        key = key + '[]'
      } else {
        val = [val]
      }

      Object.keys(val).forEach(valKey => {
        var v = val[valKey]
        if (Object.prototype.toString.call(v) === '[object Date]') {
          v = v.toISOString()
        } else if (v != null && typeof v === 'object') {
          v = JSON.stringify(v)
        }

        parts.push(encode(key) + '=' + encode(v))
      })
    })

    serializedParams = parts.join('&')
  }

  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams
  }

  return url
}
