import fs from 'fs'
import path from 'path'
import express, { Request, Response } from 'express'
import mime from 'mime'
import { compileFile } from '../shared/main.ts'
import { getExtName, codeExtNamesRegExp, getQuery } from '../shared/utils.ts'

const app = express()

const targetDir = path.resolve('vite-static', 'examples', process.env.VITE_STATIC_TARGET || 'vue')

const defaultResolver = (id: string): string => {
  return id === '/' ? '/index.html' : id
}

const defaultLoader = (id: string): string | Buffer => {
  const filePathWithQuery = path.resolve(targetDir, id.slice(1))
  const filePath = filePathWithQuery.indexOf('?') > -1 ? filePathWithQuery.slice(0, filePathWithQuery.indexOf('?')) : filePathWithQuery
  if (getExtName(id).match(codeExtNamesRegExp)) {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : ''
  }
  return fs.existsSync(filePath) ? fs.readFileSync(filePath) : Buffer.from('')
}

const handler = async (req: Request, res: Response): Promise<void> => {
  const compiledFile = await compileFile(
    { name: req.url, content: '' },
    { defaultResolver, defaultLoader, debug: false }
  )

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

app.use(handler)

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})
