'use strict'

import enqueue from './queue'
import { buildURL, lowerCaseHeaders, normalizeHeaders } from './util'

import settle from 'axios/lib/core/settle'
import createError from 'axios/lib/core/createError'

const supportedMethods = ['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'CONNECT']
const supportedResponseTypes = ['json', 'text', 'file']

/**
 * 创建用于微信小程序的 axios adapter
 *
 * @param {AxiosInstance} axios 原始 axios 对象
 * @returns {AxiosAdapter} 用于微信小程序的 axios adapter
 */
export default function wepyAxiosAdapterFactory (axios) {
  // 不使用默认的 transformResponse
  axios.defaults['transformResponse'] = []

  // 使用自定义的 transformRequest
  axios.defaults['transformRequest'] = [(data, headers) => {
    const contentTypeKey = Object.keys(headers).find(key => /content-type/i.test(key))
    if (contentTypeKey == null && data != null && typeof data === 'object') {
      headers['Content-Type'] = 'application/json; charset=utf-8'
    }

    return data
  }];

  // 删除无法使用的 axios 选项
  ['timeout', 'xsrfCookieName', 'xsrfHeaderName', 'maxContentLength'].forEach(item => {
    delete axios.defaults[item]
  })

  /**
   * 用于微信小程序的 axios adapter
   *
   * @type {AxiosAdapter}
   */
  return function wepyAxiosAdapter (config) {
    return enqueue((resolve, reject) => {
      /** 发送普通请求或是上传、下载请求 */
      let requestType = 'request'

      /** 请求所使用的参数 */
      let request = {
        url: buildURL(config.url, config.params, config.paramsSerializer),
        header: normalizeHeaders(config.headers)
      }

      // 必须在 URL 中指定是 http 还是 https 协议
      if (!/https?:\/\//.test(request.url)) {
        return reject(createError('Request protocol must be http or https', config))
      }

      // 处理调用上传文件接口的情况
      if (config.data && config.data.$upload) {
        const { filePath, name } = config.data.$upload
        if (typeof filePath === 'string' && typeof name === 'string') {
          if (config.method !== 'post') {
            return reject(createError('HTTP methods must be POST when uploading file', config))
          }

          requestType = 'uploadFile'
          config.responseType = 'file'

          request.filePath = filePath
          request.name = name
          request.formData = config.data
          delete config.data.$upload
        } else {
          return reject(createError('Invalid upload paramaters', config))
        }
      }

      // 处理响应类型和下载接口类型
      if (config.responseType && supportedResponseTypes.indexOf(config.responseType) === -1) {
        // 只接受 json 或 text 的返回类型
        return reject(createError('Unsupported responseType', config))
      } else if (requestType === 'request') {
        // 确认是否调用下载文件接口
        if (config.responseType === 'file') {
          if (config.method !== 'get') {
            reject(createError('HTTP method must be GET when downloading file', config))
          } else {
            requestType = 'downloadFile'
          }
        } else {
          // 普通请求必须使用 https
          if (process.env.NODE_ENV === 'production' && config.url.slice(0, 5).toLowerCase() !== 'https') {
            return reject(createError('Requesting an http URL is not allowed', config))
          }

          // 检查小程序是否支持所使用的 method
          config.method = config.method.toUpperCase()
          if (supportedMethods.indexOf(config.method) === -1) {
            return reject(createError('Unsupported request method', config))
          }

          request.data = config.data
          request.method = config.method

          // 增加 Content-Type
          if (!request.header['Content-Type'] && config.data && typeof config.data === 'object') {
            request.header['Content-Type'] = 'application/json; charset=utf-8'
          }
        }
      }

      // 加入回调函数
      request.success = response => {
        // 按照 axios 的返回格式构造返回值
        settle(resolve, reject, {
          data: response.data || response.tempFilePath,
          status: response.statusCode,
          headers: lowerCaseHeaders(response.header),
          config,
          request
        })
      }

      request.fail = response => reject(createError(response.errMsg, config))

      // 发送请求
      wx[requestType](request)
    })
  }
}
