/**
 * Generates `assets/iconify-icons/generated-icons.css` used by Vuexy.
 *
 * Run:
 * - `npm run build:icons`
 * - `npm install` (postinstall runs it)
 */
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

import { cleanupSVG, importDirectory, isEmptyColor, parseColors, runSVGO } from '@iconify/tools'
import type { IconifyJSON } from '@iconify/types'
import { getIcons, getIconsCSS, stringToIcon } from '@iconify/utils'

const require = createRequire(import.meta.url)

async function generateIconsCSS() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  interface BundleScriptCustomSVGConfig {
    dir: string
    monotone: boolean
    prefix: string
  }

  interface BundleScriptCustomJSONConfig {
    filename: string
    icons?: string[]
  }

  interface BundleScriptConfig {
    svg?: BundleScriptCustomSVGConfig[]
    icons?: string[]
    json?: (string | BundleScriptCustomJSONConfig)[]
  }

  const sources: BundleScriptConfig = {
    json: [require.resolve('@iconify/json/json/tabler.json')],
    icons: ['bx-basket', 'bi-airplane-engines', 'ri-anchor-line', 'uit-adobe-alt', 'twemoji-auto-rickshaw'],
    svg: []
  }

  const target = join(__dirname, 'generated-icons.css')

  // Create directory for output if missing
  const dir = dirname(target)
  await fs.mkdir(dir, { recursive: true })

  const allIcons: IconifyJSON[] = []

  // Convert sources.icons to sources.json
  if (sources.icons?.length) {
    const sourcesJSON = sources.json ? sources.json : (sources.json = [])
    const organizedList = organizeIconsList(sources.icons)

    for (const prefix in organizedList) {
      const filename = require.resolve(`@iconify/json/json/${prefix}.json`)

      sourcesJSON.push({
        filename,
        icons: organizedList[prefix]
      })
    }
  }

  // Bundle JSON files
  if (sources.json) {
    for (const item of sources.json) {
      const filename = typeof item === 'string' ? item : item.filename
      const content = JSON.parse(await fs.readFile(filename, 'utf8')) as IconifyJSON

      if (typeof item !== 'string' && item.icons?.length) {
        const filteredContent = getIcons(content, item.icons)
        if (!filteredContent) throw new Error(`Cannot find required icons in ${filename}`)
        allIcons.push(filteredContent)
      } else {
        allIcons.push(content)
      }
    }
  }

  // Bundle custom SVG icons
  if (sources.svg) {
    for (const source of sources.svg) {
      const iconSet = await importDirectory(source.dir, { prefix: source.prefix })

      await iconSet.forEach(async (name, type) => {
        if (type !== 'icon') return

        const svg = iconSet.toSVG(name)
        if (!svg) {
          iconSet.remove(name)
          return
        }

        try {
          await cleanupSVG(svg)

          if (source.monotone) {
            await parseColors(svg, {
              defaultColor: 'currentColor',
              callback: (attr, colorStr, color) => (!color || isEmptyColor(color) ? colorStr : 'currentColor')
            })
          }

          await runSVGO(svg)
        } catch (err) {
          console.error(`Error parsing ${name} from ${source.dir}:`, err)
          iconSet.remove(name)
          return
        }

        iconSet.fromSVG(name, svg)
      })

      allIcons.push(iconSet.export())
    }
  }

  const cssContent = allIcons
    .map(iconSet => getIconsCSS(iconSet, Object.keys(iconSet.icons), { iconSelector: '.{prefix}-{name}' }))
    .join('\n')

  await fs.writeFile(target, cssContent, 'utf8')
  // eslint-disable-next-line no-console
  console.log(`Saved CSS to ${target}!`)
}

generateIconsCSS().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})

function organizeIconsList(icons: string[]): Record<string, string[]> {
  const sorted: Record<string, string[]> = Object.create(null)

  icons.forEach(icon => {
    const item = stringToIcon(icon)
    if (!item) return

    const prefix = item.prefix
    const prefixList = sorted[prefix] ? sorted[prefix] : (sorted[prefix] = [])
    const name = item.name
    if (!prefixList.includes(name)) prefixList.push(name)
  })

  return sorted
}

