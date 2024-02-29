import fs from 'fs'
import path from 'path'
import express, { Request, Response } from 'express'
import { compileFile } from '../shared/main.ts'

const app = express()

const defaultResolver = (id: string): string => {
  return id === '/' ? '/index.html' : id
}

const defaultLoader = (id: string): string => {
  const filePath = path.resolve('vite-static', 'examples', 'vue', id.slice(1))
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : ''
}

const handler = async (req: Request, res: Response): Promise<void> => {
  const compiledFile = await compileFile(
    { name: req.url, content: '' },
    { defaultResolver, defaultLoader, debug: true }
  )
  if (req.url === '/' || req.url.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html')
  } else {
    res.setHeader('Content-Type', 'application/javascript')
  }
  res.send(compiledFile.content)
}

app.use(handler)

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})
