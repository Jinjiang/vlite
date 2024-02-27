# Online Editor

## Concepts

- SFC: Single File Component for Bit (content, meta)
- BFS: Bit Flavored Script (ESM/TS/JSX/CSS/LESS/SASS/CSS Modules/Assets)
- ESM: eventual running code in the browser

SFC --(extract)-> BFS --(compile)-> ESM
BFS --(compress)-> SFC
BFS --(archive)-> binary download

SFC:
- `\x00\x00<filename1>\x00<content1>\x00\x00<filename2>\x00<content2>\x00\x00...`
- filenames should be sorted before calculating hash

## Registry

1. Input: content, name?, version? -> hash
2. Output: name, version/hash -> esm
    <target> -> package.json -> deps -> node_modules -> for each package.json -> ...
3. Download: name, version/hash -> bfs

## UI

1. editor: SFC
2. iframe
3. menubar: name/version/hash/save

## Shared

- extract
- compress
- compile
- install
- archive

## Misc

- vite-static: express + compile + React demo
- 2 kinds of plugin mechanism
  - one file in one file out, no imports resolution
    easy to process
  - one file in multiple files out, imports resolution
    easy to understand, additional imports resolution
  - files -> ids, imports resolution (vite)
