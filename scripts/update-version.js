/**
 * 版本号同步脚本
 * 从 package.json 读取版本号，写入 src/version/version.ts
 * 在 npm version 之后自动运行
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'))
const version = pkg.version
const now = new Date().toISOString().split('T')[0]

const content = `/**
 * 应用版本信息 - 由 scripts/update-version.js 自动生成
 * 请勿手动修改
 */
export const APP_VERSION = '${version}'
export const APP_BUILD_DATE = '${now}'
export const APP_NAME = 'VideoKit'
export const APP_REPO = 'https://github.com/Ri1035/videokit-clone'
export const APP_DEPLOY_URL = 'https://videokit-9kp.pages.dev'
`

writeFileSync(join(root, 'src/version/version.ts'), content, 'utf-8')
console.log(`✅ 版本号已同步: v${version} (${now})`)
