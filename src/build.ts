import parseImports, { Import } from 'parse-imports'
import { compileRequest } from "./compile.js"
import { Request } from "./types.js"
import { genId, getQuery, removeQuery } from "./utils.js"
import { dirname, join } from 'path'
import { replaceImport } from './plugins/esm.js'
import { writeFileSync } from 'fs'

const idSrcToDist = new Map<string, string>()
const idDistToSrc = new Map<string, string>()
const codeMap: Record<string, string> = {}
const depsMap: Record<string, Deps> = {}
const binaryMap: Record<string, Buffer> = {}

type ImportRecord = {
  specifier: string;
  id: string;
  import: Import;
}

type Deps = {
  base: string;
  specifierSet: Set<string>;
  importRecords: ImportRecord[];
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
      if (!moduleSpecifier.value.match(/^(https?:)?\/\//)) {
        return
      }
      importRecords.push({
        id: join(base, moduleSpecifier.value),
        specifier: moduleSpecifier.value,
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

export const traverse = async (entries: Request[]) => {
  const queue: Request[] = []
  await Promise.all(entries.map(async (entry) => {
    const idSrc = genId(entry.name, entry.query)
    if (idSrcToDist.has(idSrc)) return
    const result = await compileRequest(entry)
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
}

export const generate = async () => {
  const generatedNameList: string[] = []
  idSrcToDist.forEach((idDist, idSrc) => {
    const code = codeMap[idSrc]
    const deps = depsMap[idSrc]
    const generatedName = join('dist', idDist + '.js')
    let generatedCode = code
    deps.importRecords.forEach(record => {
      const depIdSrc = record.id
      const depIdDist = idSrcToDist.get(depIdSrc)
      if (!depIdDist) return
      const newSpecifier = depIdDist + '.js'
      generatedCode = replaceImport(generatedCode, record.import, newSpecifier)
    })
    writeFileSync(generatedName, generatedCode)
    generatedNameList.push(generatedName)
  })
  for (const [name, buffer] of Object.entries(binaryMap)) {
    const generatedName = join('dist', name)
    writeFileSync(generatedName, buffer)
    generatedNameList.push(generatedName)
  }
  console.log('Generated:', generatedNameList.join(', '))
}
