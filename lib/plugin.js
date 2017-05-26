'use strict'

const fs = require('fs')
const path = require('path')

let warned = false

module.exports = class wepyAxiosPlugin {
  constructor () {
    const axios = path.resolve(__dirname, '../../axios')
    if (fs.existsSync(axios)) {
      const target = path.join(axios, 'lib/defaults.js')
      let code = fs.readFileSync(target, 'utf8')

      // 删除整个 getDefaultAdapter 函数
      code = code.replace(/function getDefaultAdapter(.|[\r\n])*?return adapter;[\r\n]}[\r\n]/, '')

      // 删除默认 adapter
      code = code.replace(`adapter: getDefaultAdapter(),`, '')

      fs.writeFileSync(target, code)

      if (!warned) {
        console.warn('[警告] 为了能够让 wepy 成功编译 axios, 已修改 axios 源文件')
        console.warn('[警告] 你将只能配合 wepy-plugin-axios 在 wepy 中使用此项目中的 axios')
        warned = true
      }
    }
  }

  apply (op) {
    op.next()
  }
}
