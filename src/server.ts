import fs from 'fs'
import path from 'path'
import express, { Request, Response } from 'express'
import mime from 'mime'
import { compileRequest } from './compile.js'
import { Context, Request as FileRequest } from './types.js'
import { getExtName, codeExtNamesRegExp, getQuery } from './utils.js'

const prepareRequest = (req: Request): FileRequest => {
  const id = req.url
  const pathname = req.url?.split('?')[0]
  const name = pathname === '/' ? '/index.html' : pathname
  const query = getQuery(req.url)
  return {
    id,
    name,
    query,
  }
}

const prepareContext = (targetDir: string): Context => {
  const defaultLoader = (req: FileRequest): string | Buffer => {
    const { name } = req
    const filename = path.resolve(targetDir, name.slice(1))
    if (getExtName(name).match(codeExtNamesRegExp)) {
      return fs.existsSync(filename) ? fs.readFileSync(filename, 'utf-8') : ''
    }
    return fs.existsSync(filename) ? fs.readFileSync(filename) : Buffer.from('')
  }
  return { defaultLoader, debug: false }
}

export const createServer = (targetDir: string, port: number) => {
  const resolvedTargetDir = targetDir || path.resolve('./')
  const resolvedPort = port || 3000

  const context = prepareContext(resolvedTargetDir)

  const requestHandler = async (req: Request, res: Response): Promise<void> => {
    const fileRequest = prepareRequest(req)

    // Compile file
    const compiledFile = await compileRequest(
      fileRequest,
      context
    )

    // Set Content-Type
    if (fileRequest.name.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html')
    } else if (getExtName(fileRequest.name).match(codeExtNamesRegExp)) {
      res.setHeader('Content-Type', 'application/javascript')
    } else if (fileRequest.query.url) {
      res.setHeader('Content-Type', 'application/javascript')
    } else {
      res.setHeader('Content-Type', mime.getType(fileRequest.name) || 'text/plain')
    }

    res.send(compiledFile.content)
  }

  const app = express()
  app.use(requestHandler)
  app.listen(resolvedPort, () => {
    console.log(`Server running at http://localhost:${resolvedPort}`)
  })
}
