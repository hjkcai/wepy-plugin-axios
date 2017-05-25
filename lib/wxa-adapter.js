'use strict'

import settle from 'axios/lib/core/settle'
import buildURL from 'axios/lib/helpers/buildURL'
import createError from 'axios/lib/core/createError'

const supportedMethods = ['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'CONNECT']
const supportedResponseTypes = ['json', 'text', 'file']

/**
 * 创建用于微信小程序的 axios adapter
 *
 * @param {AxiosInstance} axios 原始 axios 对象
 * @returns {AxiosAdapter} 用于微信小程序的 axios adapter
 */
export default function wxaAdapterFactory (axios) {
  // 往 axios 的默认设置中加入 upload 项
  // 否则得到的 config 中将不会有 upload 项
  axios.defaults['upload'] = undefined

  /**
   * 用于微信小程序的 axios adapter
   *
   * @type {AxiosAdapter}
   */
  return function wxaAdapter (config) {
    return new Promise((resolve, reject) => {
      /** 发送普通请求或是上传、下载请求 */
      let requestType = 'request'

      /** 请求所使用的参数 */
      let request = {
        url: buildURL(config.url, config.params, config.paramsSerializer),
        header: config.headers
      }

      // 处理调用上传文件接口的情况
      if (config.upload) {
        const { filePath, name } = config.upload
        if (typeof filePath === 'string' && typeof name === 'string') {
          requestType = 'uploadFile'
          config.responseType = 'file'
          Object.assign(request, config.upload)
        } else {
          return reject(createError('Invalid upload paramaters', config))
        }
      }

      // 处理响应类型和下载接口类型
      if (config.responseType && supportedResponseTypes.indexOf(config.responseType) === -1) {
        // 只接受 json 或 text 的返回类型
        return reject(createError('Unsupported responseType', config))
      } else if (config.responseType === 'text' && config.transformResponse[0] === axios.defaults.transformResponse[0]) {
        // axios 默认会尝试将文本转为 json
        // 这里保证返回类型为 text 时返回的一定是文本
        config.transformResponse = []
      } else if (requestType === 'request') {
        // 确认是否调用下载文件接口
        if (config.responseType === 'file') {
          requestType = 'downloadFile'
        } else {
          // 必须使用 https
          if (config.url.slice(0, 5).toLowerCase() !== 'https') {
            return reject(createError('Requesting an http URL is not allowed', config))
          }

          // 检查小程序是否支持所使用的 method
          config.method = config.method.toUpperCase()
          if (supportedMethods.indexOf(config.method) === -1) {
            return reject(createError('Unsupported request method', config))
          }
        }
      }

      wx[requestType]({
        ...request,
        success: response => {
          // 按照 axios 的返回格式构造返回值
          settle(resolve, reject, {
            data: response.data || response.tempFilePath,
            status: response.statusCode,
            headers: response.header,
            config,
            request
          })
        },
        fail: response => reject(createError(response.errMsg, config))
      })
    })
  }
}
