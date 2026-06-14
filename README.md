# 定制烟花页（Mobile-first）

基于 [NianBroken/Firework_Simulator](https://github.com/NianBroken/Firework_Simulator) 二次定制，优先适配手机微信浏览器。

Modified by Jingcheng.

## 手机测试链接

https://firework-navy.vercel.app/?v=mobile-1

## 本地运行

```powershell
Set-Location "c:\Users\余竟成\Desktop\Firework_Simulator"
python -m http.server 8080
```

## 参数调节

| 文件 | 内容 |
|------|------|
| `js/app/config.js` → `mobile` | 手机性能：粒子数、Shell 数、点击节流、自动间隔 |
| `js/app/config.js` → `audio` | 音效音量、并发上限 |
| `js/app/config.js` → `overlay` | 首页文案与淡出时间 |

## 重新提交 GitHub

```powershell
cd "c:\Users\余竟成\Desktop\Firework_Simulator"
git add .
git commit -m "Mobile-first WeChat fireworks page"
git push origin main
```

Vercel 绑定该仓库后会自动部署，用手机打开上方测试链接即可。

## 许可证

Copyright © NianBroken · Apache-2.0 · 详见 [LICENSE](./LICENSE)
