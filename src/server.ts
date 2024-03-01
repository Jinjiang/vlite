import fs from 'fs'
import path from 'path'
import express, { Request, Response } from 'express'
import mime from 'mime'
import { compileFile } from './compile.js'
import { getExtName, codeExtNamesRegExp, getQuery } from './utils.js'

export const createServer = (targetDir: string, port: number) => {
  const resolvedTargetDir = targetDir || path.resolve('./')
  const resolvedPort = port || 3000

  const defaultResolver = (id: string): string => {
    return id === '/' ? '/index.html' : id
  }

  const defaultLoader = (id: string): string | Buffer => {
    const filePathWithQuery = path.resolve(resolvedTargetDir, id.slice(1))
    const filePath = filePathWithQuery.indexOf('?') > -1 ? filePathWithQuery.slice(0, filePathWithQuery.indexOf('?')) : filePathWithQuery
    if (getExtName(id).match(codeExtNamesRegExp)) {
      return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : ''
    }
    return fs.existsSync(filePath) ? fs.readFileSync(filePath) : Buffer.from('')
  }

  const requestHandler = async (req: Request, res: Response): Promise<void> => {

    // Compile file
    const compiledFile = await compileFile(
      { name: req.url, content: '' },
      { defaultResolver, defaultLoader, debug: false }
    )

    // Set Content-Type
    if (req.url === '/' || req.url.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html')
    } else if (getExtName(req.url).match(codeExtNamesRegExp)) {
      res.setHeader('Content-Type', 'application/javascript')
    } else if (getQuery(req.url).url) {
      res.setHeader('Content-Type', 'application/javascript')
    } else {
      res.setHeader('Content-Type', mime.getType(req.url) || 'text/plain')
    }

    res.send(compiledFile.content)
  }

  const app = express()
  app.use(requestHandler)
  app.listen(resolvedPort, () => {
    console.log(`Server running at http://localhost:${resolvedPort}`)
  })
}
