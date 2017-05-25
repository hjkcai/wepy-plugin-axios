'use strict'

const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const rollup = require('rollup')

const buble = require('rollup-plugin-buble')
const uglify = require('rollup-plugin-uglify')
const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')

const dist = path.resolve(__dirname, '../dist')
if (fs.existsSync(dist)) rimraf.sync(dist)
fs.mkdirSync(dist)

build([
  {
    suffix: '',
    type: 'umd',
    env: 'development'
  },
  {
    suffix: 'min',
    type: 'umd',
    env: 'production'
  },
  {
    suffix: 'common',
    type: 'cjs'
  }
])

function build (configs) {
  let promise = Promise.resolve()
  configs.forEach(config => {
    promise = promise.then(() => {
      const rollupConfig = {
        entry: path.resolve(__dirname, '../lib/wxa-adapter.js'),
        sourceMap: true,
        plugins: [
          nodeResolve(),
          commonjs(),
          buble()
        ]
      }

      if (config.suffix === 'min') {
        rollupConfig.plugins.push(uglify({ sourceMap: true }))
      }

      return rollup.rollup(rollupConfig)
    }).then(bundle => {
      const dest = path.join(dist, `wxa-adapter${config.suffix ? `-${config.suffix}` : ''}.js`)
      return bundle.write({
        dest,
        format: config.type,
        moduleName: 'wxaAdapter',
        sourceMap: true
      })

      // if (config.suffix === 'min') {
      //   result = uglify.minify(result.code, {
      //     fromString: true,
      //     output: {
      //       screw_ie8: true,
      //       ascii_only: true
      //     },
      //     compress: {
      //       pure_funcs: ['makeMap']
      //     }
      //   })
      // }

      // console.log(path.parse(dest).base, size(result.code))
      // return write(dest, result.code)
    })
  })
}

// function write (dest, content) {
//   return new Promise((resolve, reject) => {
//     fs.writeFile(dest, content, err => {
//       if (err) reject(err)
//       else resolve()
//     })
//   })
// }

// function size (code) {
//   return (code.length / 1024).toFixed(2) + 'kb'
// }

