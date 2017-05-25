'use strict'

const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const rollup = require('rollup')

const buble = require('rollup-plugin-buble')
const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')

const dist = path.resolve(__dirname, '../dist')
if (fs.existsSync(dist)) rimraf.sync(dist)
fs.mkdirSync(dist)

Promise.resolve().then(() => {
  const rollupConfig = {
    entry: path.resolve(__dirname, '../lib/wxa-adapter.js'),
    sourceMap: true,
    plugins: [
      nodeResolve(),
      commonjs(),
      buble()
    ]
  }

  return rollup.rollup(rollupConfig)
}).then(bundle => {
  const dest = path.join(dist, 'wxa-adapter.js')
  return bundle.write({
    dest,
    format: 'cjs',
    moduleName: 'wxaAdapter',
    sourceMap: true
  })
})
