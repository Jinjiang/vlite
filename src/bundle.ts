import { createRequire } from 'module'
import { dirname, join } from 'path'
import { writeFileSync } from 'fs'
import * as rolldown from '@rolldown/node'
import { copyOtherFiles, readHtml } from './build.js'

const require = createRequire(import.meta.url)
const fsExtra = require('fs-extra')

export const bundle = async (targetDir: string) => {
  const distDir = join(targetDir, 'dist')
  const bundleDir = join(targetDir, 'bundle')

  const { html, scripts } = readHtml(distDir)
  const input = join(distDir, scripts[0].id)
  
  const build = await rolldown.rolldown({
    input,
    // @ts-ignore
    cwd: distDir,
    resolve: {
      conditionNames: ['node', 'import'],
      alias: {},
    }
  })
  await build.write({
    dir: bundleDir
  })

  copyOtherFiles(targetDir, 'bundle')

  const bundleHtmlFile = join(bundleDir, 'index.html')
  fsExtra.ensureDirSync(dirname(bundleHtmlFile))
  writeFileSync(bundleHtmlFile, html)
}
