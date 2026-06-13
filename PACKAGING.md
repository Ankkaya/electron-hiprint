# Windows 打包说明

本文档记录本项目在 Windows 下打包 win32 和 win64 安装包的关键步骤，以及已踩过的坑。

## 环境要求

- Node.js: 当前使用 `v24.14.1`（高版本亦可，已验证兼容）
- npm: 随 Node.js 自带即可
- Electron: `17.4.11`
- electron-builder: `23.0.6`
- Visual Studio Build Tools: 需安装 C++ 桌面开发组件和 Windows SDK（用于 `sqlite3` native rebuild）

## 关键配置

`.npmrc` 包含：

```ini
electron_mirror=https://cdn.npmmirror.com/binaries/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

用于加速 Electron 和 electron-builder 二进制文件的下载。

## 安装依赖

```powershell
npm install
```

## 建议使用短路径打包

原项目路径较长，NSIS 可能在打包阶段因为路径过长找不到模板文件，例如：

```text
allowOnlyOneInstallerInstance.nsh
```

建议复制项目到短路径后打包：

```text
C:\tmp\hiprint-build
```

示例：

```powershell
robocopy 原项目目录 C:\tmp\hiprint-build /E /XD node_modules out
```

然后在 `C:\tmp\hiprint-build` 中安装依赖并打包。

## 打包命令

32 位：

```powershell
npm run build-w
```

即：

```powershell
npx electron-builder -w nsis:ia32 && node ./tools/rename --tag win_x32
```

64 位：

```powershell
npm run build-w-64
```

即：

```powershell
npx electron-builder -w nsis:x64 && node ./tools/rename --tag win_x64
```

## 关于 npmRebuild

默认情况下 electron-builder 会自动 rebuild 原生模块（如 `sqlite3`），将其编译为与 Electron 17（Node 16.x ABI）匹配的版本。

本项目运行时依赖 `sqlite3`，因此**不能跳过 rebuild**，否则会出现 `NODE_MODULE_VERSION mismatch` 错误。

rebuild 需要以下条件：

1. Visual Studio Build Tools 的 C++ 桌面开发组件
2. Windows SDK

如果本机缺少上述组件，会报错：

```text
node-gyp ERR! find VS - missing any Windows SDK
```

此时可临时使用 `--config.npmRebuild=false` 跳过 rebuild 生成安装包，但运行时 sqlite3 功能会不可用。建议尽快补装所需组件后重新打包。

## 产物目录

```text
项目目录\out
```

生成文件：

```text
hiprint_win_x32-1.0.15-beta4.exe
hiprint_win_x64-1.0.15-beta4.exe
```

## 验证 app.asar

可以检查 `app.asar` 中是否包含关键依赖：

```powershell
npx asar list out\win-unpacked\resources\app.asar | Select-String '\\node_modules\\conf'
npx asar list out\win-ia32-unpacked\resources\app.asar | Select-String '\\node_modules\\conf'
```

应能看到类似：

```text
\node_modules\conf
\node_modules\conf\package.json
\node_modules\conf\dist
```

也建议确认：

```powershell
npx asar list out\win-unpacked\resources\app.asar | Select-String '\\node_modules\\electron-store'
```

## 常见问题

### NSIS 找不到 include 文件

通常是路径过长导致。把项目复制到短路径，例如 `C:\tmp\hiprint-build`，再打包。

### sqlite3 rebuild 失败

如果看到 Windows SDK 或 Visual Studio Build Tools 相关报错，需安装：

1. Visual Studio Build Tools 的 C++ 桌面开发组件
2. Windows SDK（任意版本即可）

安装后重新执行打包命令即可。

### 启动报 Cannot find module 'conf'

处理方式：

1. 删除旧的 `node_modules`
2. 重新执行 `npm install`
3. 重新打包
4. 卸载旧安装包后安装新包
