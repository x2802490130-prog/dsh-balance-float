// 图标素材体检：node check-icon.mjs <图片路径>
// 无依赖，自动判断素材能否被一键处理成桌面图标，并给出原因与修复建议。
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

function decodePNG(buf) {
  let pos = 8, idat = [], w = 0, h = 0, bd = 0, ct = 0
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    pos += 12 + len
  }
  if (bd !== 8 || ct !== 6) throw new Error('需要 8 位 RGBA 的 PNG（当前: 位深' + bd + ' 颜色类型' + ct + '）')
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * 4, out = Buffer.alloc(w * h * 4)
  let rp = 0
  for (let y = 0; y < h; y++) {
    const f = raw[rp++]
    const line = raw.subarray(rp, rp + stride); rp += stride
    const prev = out.subarray((y - 1) * stride, y * stride)
    const cur = out.subarray(y * stride, (y + 1) * stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? cur[i - 4] : 0, b = y > 0 ? prev[i] : 0, c = (i >= 4 && y > 0) ? prev[i - 4] : 0
      let v = line[i]
      if (f === 1) v = (v + a) & 255
      else if (f === 2) v = (v + b) & 255
      else if (f === 3) v = (v + ((a + b) >> 1)) & 255
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v = (v + ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c))) & 255
      }
      cur[i] = v
    }
  }
  return { data: out, w, h }
}

const p = process.argv[2]
if (!p) { console.log('用法: node check-icon.mjs <图片路径>'); process.exit(2) }
const buf = readFileSync(p)
const fails = []
const warns = []
const ok = (label, good, extra = '') => {
  console.log((good ? '✅' : '❌') + ' ' + label + (extra ? ' | ' + extra : ''))
  if (!good) fails.push(label)
}

// 1. 格式
let img
try {
  if (!buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) throw new Error('不是 PNG（请让生成方输出 PNG 格式）')
  img = decodePNG(buf)
} catch (e) {
  ok('格式检查', false, e.message)
  console.log('\n结论：❌ 无法处理，请按上方提示重新生成。')
  process.exit(1)
}
const { data, w, h } = img
ok('格式检查', true, w + '×' + h + ' PNG')
ok('正方形', w === h, w === h ? '' : '当前 ' + w + '×' + h + '（需 1:1）')

// 2. 透明度三分类（最关键）
const total = w * h
let opaque = 0, transparent = 0, semi = 0
for (let i = 3; i < total * 4; i += 4) {
  const a = data[i]
  if (a >= 250) opaque++
  else if (a <= 10) transparent++
  else semi++
}
ok('不透明占比正常', opaque / total > 0.2, (opaque / total * 100).toFixed(1) + '%')
ok('半透明像素极少', semi / total < 0.05, (semi / total * 100).toFixed(2) + '%（>5% 说明图被半透明污染，需重新生成）')
if (transparent / total > 0) ok('透明背景完整', transparent / total > 0.2 || semi === 0, (transparent / total * 100).toFixed(1) + '%')

// 3. 边缘背景判定
const edge = []
for (let x = 0; x < w; x += 8) { edge.push([x, 0], [x, h - 1]) }
for (let y = 0; y < h; y += 8) { edge.push([0, y], [w - 1, y]) }
let eT = 0, eO = 0
let rS = 0, gS = 0, bS = 0, nS = 0, r2 = 0, g2 = 0, b2 = 0
for (const [x, y] of edge) {
  const i = (y * w + x) * 4
  if (data[i + 3] <= 10) eT++
  else if (data[i + 3] >= 250) {
    eO++
    rS += data[i]; gS += data[i + 1]; bS += data[i + 2]
    r2 += data[i] * data[i]; g2 += data[i + 1] * data[i + 1]; b2 += data[i + 2] * data[i + 2]
    nS++
  }
}
const stddev = nS ? Math.sqrt((r2 + g2 + b2 - (rS * rS + gS * gS + bS * bS) / nS) / nS) : 999
let mode = 'unknown'
if (eT / edge.length > 0.8) mode = 'transparent'
else if (eO / edge.length > 0.8 && stddev < 12) mode = 'solid'
else if (eO / edge.length > 0.8) mode = 'fullbleed'
console.log('\n背景判定: ' + {
  transparent: '透明背景（可直接抠图处理）',
  solid: '纯色背景（可一键去底，建议纯白）',
  fullbleed: '满幅复杂背景（作为成品图标保留背景直接缩放，也可用）',
  unknown: '边缘背景不干净（混有半透明或杂色）',
}[mode])

// 4. 背景纹理/马赛克警告
if (mode === 'transparent') {
  let dev = 0, n = 0
  for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) {
    const i = (y * w + x) * 4
    if (data[i + 3] >= 250) {
      const i2 = (Math.min(y + 6, h - 1) * w + Math.min(x + 6, w - 1)) * 4
      dev += Math.abs(data[i] - data[i2]) + Math.abs(data[i + 1] - data[i2 + 1]) + Math.abs(data[i + 2] - data[i2 + 2])
      n++
    }
  }
  dev /= n * 3
  if (dev > 45) warns.push('不透明区域纹理剧烈（平均差 ' + dev.toFixed(0) + '）：背景可能混入了马赛克/格子图案，请目视确认背景是否干净')
  else console.log('背景纹理检查: ✅ 平缓（平均差 ' + dev.toFixed(0) + '）')
}

console.log('\n结论: ' + (fails.length === 0 ? '✅ 可以一键处理成图标' : '❌ ' + fails.join('；') + ' —— 需重新生成'))
if (warns.length) console.log('⚠ ' + warns.join('\n⚠ '))
