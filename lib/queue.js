'use strict'

/** 请求队列 */
const queue = []

/** 未完成的请求数 */
let pendingRequests = 0

/** 最多同时发送的请求数 */
const MAX_PENDING_REQUESTS = 5

/** 检查是否可以发送下一个请求. 如果可以，则发送 */
function checkQueue () {
  while (pendingRequests < MAX_PENDING_REQUESTS) {
    const item = queue.shift()
    if (!item) break

    pendingRequests++
    new Promise(item.promiseFunc).then(result => {
      pendingRequests--
      item.resolve(result)
      checkQueue()
    }).catch(err => {
      pendingRequests--
      item.reject(err)
      checkQueue()
    })
  }
}

/**
 * 将一个请求加入队列中. 如果当前没有正在排队的请求则立即发送
 *
 * @param {Function} promiseFunc 要入队的请求
 */
export default function enqueue (promiseFunc) {
  return new Promise((resolve, reject) => {
    queue.push({ resolve, reject, promiseFunc })
    checkQueue()
  })
}
