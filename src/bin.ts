#!/usr/bin/env node

import { createRequire } from "module";
import minimist from 'minimist'
import { createServer } from './server.js'
import { build } from "./build.js";

const require = createRequire(import.meta.url);

const helpMessage = `
This is vlite!

Usage:
  vlite [<target-dir>] [--port <port>]
  vlite [<target-dir>] --build
  vlite --help
  vlite --version
`.trim()

const main = () => {
  const argv = minimist(process.argv.slice(2))

  const help = () => console.log(helpMessage)

  if (argv.v || argv.version) {
    console.log(require('../package.json').version)
    return
  }

  if (argv.h || argv.help) {
    help()
    return
  }

  const targetDir = argv._[0]
  const port = argv.p || argv.port || 3000

  if (argv.build) {
    build(targetDir)
    return
  }

  createServer(targetDir, port)
}

main()
