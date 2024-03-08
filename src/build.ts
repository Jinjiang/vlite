import { createRequire } from 'module'
import { dirname, join, relative, resolve } from 'path'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import parseImports, { Import } from 'parse-imports'
import { Parser as HtmlParser } from 'htmlparser2'
import { compileRequest } from "./compile.js"
import { Request } from "./types.js"
import { codeExtNamesRegExp, genId, getExtName, getQuery, removeQuery } from "./utils.js"
import { replaceImport } from './plugins/esm.js'

const require = createRequire(import.meta.url)
const fsExtra = require('fs-extra')

const allFileList: Set<string> = new Set()
const idSrcToDist = new Map<string, string>()
const idDistToSrc = new Map<string, string>()
const codeMap: Record<string, string> = {}
const depsMap: Record<string, Deps> = {}
const binaryMap: Record<string, Buffer> = {}

type ImportRecord = {
  specifier: string;
  id: string;
  depIdSrc: string;
  import: Import;
}

type Deps = {
  base: string;
  specifierSet: Set<string>;
  importRecords: ImportRecord[];
}

export const readHtml = (targetDir: string) => {
  const entryHtml = join(targetDir, 'index.html')
  const entryHtmlContent = readFileSync(entryHtml, 'utf-8')
  const entryScripts: Request[] = []
  const htmlParser = new HtmlParser({
    onopentag(name, attrs) {
      if (name === 'script' && attrs.type === 'module' && attrs.src) {
        const id = join('/', attrs.src)
        entryScripts.push({ id, name: id, query: {} })
      }
    }
  })
  htmlParser.write(entryHtmlContent)
  htmlParser.end()
  return {
    html: entryHtmlContent,
    scripts: entryScripts
  }
}

const getDeps = async (base: string, code: string): Promise<Deps> => {
  const imports = [...(await parseImports(code))]
  const importRecords: ImportRecord[] = []
  imports.reverse().forEach($import => {
    const { moduleSpecifier } = $import
    if (moduleSpecifier.value) {
      if (moduleSpecifier.type !== 'relative') {
        return
      }
      if (moduleSpecifier.value.match(/^(https?:)?\/\//)) {
        return
      }
      const id = join(base, moduleSpecifier.value)
      const depName = removeQuery(id)
      const depQuery = getQuery(id)
      const depIdSrc = genId(depName, depQuery)
      importRecords.push({
        specifier: moduleSpecifier.value,
        id,
        depIdSrc,
        import: $import
      })
    }
  })
  return {
    base,
    specifierSet: new Set(importRecords.map(record => record.id)),
    importRecords,
  }
}

const traverse = async (entries: Request[], targetDir: string, forBundle?: boolean) => {
  const queue: Request[] = []
  await Promise.all(entries.map(async (entry) => {
    const idSrc = genId(entry.name, entry.query)
    if (idSrcToDist.has(idSrc)) return

    const result = await compileRequest(entry, {
      command: forBundle ? 'bundle' : 'build',
      defaultLoader: async (req) => {
        const filename = resolve(targetDir, req.name.slice(1))
        const existed = existsSync(filename)
        if (getExtName(entry.name).match(codeExtNamesRegExp)) {
          return existed ? readFileSync(filename, 'utf-8') : ''
        }
        return existed ? readFileSync(filename) : Buffer.from('')
      }    
    })

    const idDist = genId(result.name, result.query)

    idSrcToDist.set(idSrc, idDist)
    idDistToSrc.set(idDist, idSrc)

    if (typeof result.content === 'string') {
      codeMap[idSrc] = result.content
      const deps = await getDeps(dirname(entry.name), result.content)
      depsMap[idSrc] = deps
      deps.specifierSet.forEach(specifier => {
        const depName = removeQuery(specifier)
        const depQuery = getQuery(specifier)
        const depIdSrc = genId(depName, depQuery)
        if (!idSrcToDist.has(depIdSrc)) {
          queue.push({ id: specifier, name: depName, query: depQuery })
        }
      })
    } else {
      binaryMap[entry.name] = result.content
    }
  }))
  if (queue.length > 0) {
    await traverse(queue, targetDir)
  }
}

const generate = async (targetDir: string) => {
  const generatedNameList: string[] = []
  idSrcToDist.forEach((idDist, idSrc) => {
    const code = codeMap[idSrc]
    const deps = depsMap[idSrc]
    const generatedName = join(targetDir, 'dist', idDist + '.js')
    let generatedCode = code
    deps && deps.importRecords.forEach(record => {
      const depIdSrc = record.depIdSrc
      const depIdDist = idSrcToDist.get(depIdSrc)
      if (!depIdDist) return
      const newSpecifier = relative(
        dirname(generatedName),
        join(targetDir, 'dist', '.' + depIdDist + '.js')
      )
      const newRelativeSpecifier = newSpecifier.startsWith('.') ? newSpecifier : './' + newSpecifier
      generatedCode = replaceImport(generatedCode, record.import, newRelativeSpecifier)
    })
    fsExtra.ensureDirSync(dirname(generatedName))
    writeFileSync(generatedName, generatedCode)
    generatedNameList.push(generatedName)
  })
  for (const [name, buffer] of Object.entries(binaryMap)) {
    const generatedName = join(targetDir, 'dist', name)
    fsExtra.ensureDirSync(dirname(generatedName))
    writeFileSync(generatedName, buffer)
    generatedNameList.push(generatedName)
  }

  return generatedNameList
}

const generateHtml = (html: string, scripts: Request[], targetDir: string) => {
  let generatedEntryHtmlContent = html
  scripts.forEach(script => {
    const idSrc = genId(script.name, script.query)
    const idDist = idSrcToDist.get(idSrc)
    if (!idDist) return
    generatedEntryHtmlContent = generatedEntryHtmlContent.replace(
      script.name,
      idDist + '.js'
    )
  })
  const generatedEntryHtml = join(targetDir, 'dist', 'index.html')
  fsExtra.ensureDirSync(dirname(generatedEntryHtml))
  writeFileSync(generatedEntryHtml, generatedEntryHtmlContent)
  return generatedEntryHtml
}

const ignoredFiles = new Set([
  'package.json',
  'node_modules',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'dist',
  'bundle'
])

const getAllFiles = (dirPath: string) => {
  const files = readdirSync(dirPath)
  files.forEach((file) => {
    if (file.startsWith('.')) return
    if (ignoredFiles.has(file)) {
      return
    }
    if (statSync(join(dirPath, file)).isDirectory()) {
      getAllFiles(join(dirPath, file))
    } else {
      allFileList.add(join(dirPath, file))
    }
  })
}

export const copyOtherFiles = (targetDir: string, copyTo: string) => {
  return Array.from(allFileList).map(file => {
    if (file === join(targetDir, 'index.html')) {
      return
    }
    if (getExtName(file).match(codeExtNamesRegExp)) {
      return ''
    }
    const distFile = join(targetDir, copyTo, relative(targetDir, file))
    fsExtra.ensureDirSync(dirname(distFile))
    fsExtra.copyFileSync(file, distFile)
    return distFile
  }).filter(Boolean)
}

export const build = async (targetDir: string, forBundle?: boolean) => {
  getAllFiles(targetDir)
  const { html, scripts } = readHtml(targetDir)
  await traverse(scripts, targetDir, forBundle)
  const generatedNameList = await generate(targetDir)
  const generatedEntryHtml = generateHtml(html, scripts, targetDir)
  const otherFiles = copyOtherFiles(targetDir, 'dist')
  console.log(`Generated:\n${[generatedEntryHtml, ...generatedNameList, ...otherFiles].map(x => `- ${x}`).join('\n')}`)
}
