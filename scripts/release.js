/**
 * 发布脚本
 * 用法: npm run release -- patch|minor|major
 * 1. 更新版本号
 * 2. 更新 CHANGELOG（手动确认后）
 * 3. 构建
 * 4. Git 提交 + 打 tag
 * 5. 提示推送和部署
 */
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const type = process.argv[2] || 'patch'
const validTypes = ['patch', 'minor', 'major']

if (!validTypes.includes(type)) {
  console.error(`❌ 无效的版本类型: ${type}，应为 patch/minor/major`)
  process.exit(1)
}

console.log(`🚀 开始发布 ${type} 版本...`)

// 1. 更新版本号
execSync(`npm version ${type} --no-git-tag-version`, { cwd: root, stdio: 'inherit' })
execSync('node scripts/update-version.js', { cwd: root, stdio: 'inherit' })

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'))
const version = pkg.version

console.log(`\n📝 下一步:`)
console.log(`  1. 检查 CHANGELOG.md，确保 v${version} 的内容已更新`)
console.log(`  2. 运行以下命令提交和部署:`)
console.log(`     git add -A && git commit -m "release: v${version}"`)
console.log(`     git tag v${version}`)
console.log(`     git push origin main --tags`)
console.log(`     npm run deploy`)
console.log(`\n⚠️  请手动确认 CHANGELOG 后再提交。`)
