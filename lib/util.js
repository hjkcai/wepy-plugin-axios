'use strict'

/**
 * 将 headers 对象中的 key 都转为小写
 *
 * @param {Object} headers 要转换的 headers 对象
 */
export function transformResponseHeaders (headers) {
  if (headers == null) return {}

  const result = {}
  Object.keys(headers).forEach(key => {
    result[key.toLowerCase()] = result[key]
  })

  return result
}
