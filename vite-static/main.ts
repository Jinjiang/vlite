import fs from 'fs'
import path from 'path'
import express from 'express'
import { compile } from '../shared/main.ts'
import { File } from '../shared/types.ts'

const app = express()

app.use(async (req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url
  const filePath = path.resolve('vite-static', 'examples', 'vue', urlPath.slice(1))
  const file: File = {
    name: urlPath,
    content: fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : ''
  }
  const compiledFiles = await compile([file], { debug: true })
  if (urlPath.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html')
  } else {
    res.setHeader('Content-Type', 'application/javascript')
  }
  res.send(compiledFiles[0].content)
})

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})
