# GitHub Actions 自动部署指南

本指南将帮助你使用 GitHub Actions 自动编译和部署 OPT Mentor 项目到 GitHub Pages。

## 🚀 快速开始

### 1. 启用 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 `Settings` → `Pages`
3. 在 `Source` 部分选择 `GitHub Actions`
4. 保存设置

### 2. 配置仓库权限

1. 进入 `Settings` → `Actions` → `General`
2. 在 `Workflow permissions` 部分选择 `Read and write permissions`
3. 勾选 `Allow GitHub Actions to create and approve pull requests`
4. 保存设置

### 3. 推送代码触发部署

```bash
# 添加所有文件
git add .

# 提交更改
git commit -m "Add GitHub Actions deployment configuration"

# 推送到主分支
git push origin main
```

## 📁 项目结构

```
OPT_Mentor/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 配置
├── optlite-webllm/
│   ├── webllm-components/      # WebLLM 组件
│   │   ├── package.json
│   │   └── src/
│   │       └── config.ts       # WebLLM 配置
│   └── optlite-components/     # OPTLite 组件
│       ├── package.json
│       ├── webpack.config.js   # Webpack 配置
│       └── js/
│           └── template/
│               ├── live.html   # 模板文件
│               └── visualize.html
├── AI-Model/                   # AI 模型服务器
└── mlc-llm/                    # 模型转换工具
```

## 🔧 GitHub Actions 工作流程

### 触发条件
- 推送到 `main` 或 `master` 分支
- 创建 Pull Request
- 手动触发 (`workflow_dispatch`)

### 构建步骤
1. **检出代码**: 获取最新代码
2. **设置环境**: 配置 Node.js 22 和 Python 3.10
3. **安装依赖**: 安装系统依赖和全局 npm 包
4. **构建 WebLLM**: 编译 WebLLM 组件
5. **构建 OPTLite**: 使用 webpack 构建 OPTLite 组件
6. **准备部署**: 复制构建文件到部署目录
7. **部署到 GitHub Pages**: 自动部署到 GitHub Pages

## 📦 部署内容

### 自动生成的页面
- **`live.html`**: 主要的交互式编程界面 (由 webpack 自动生成)
- **`index.html`**: 代码执行可视化界面 (由 webpack 自动生成)
- **`*.bundle.js`**: 编译后的 JavaScript 文件
- **`*.css`**: 样式文件
- **`webllm/`**: WebLLM 组件库文件

### 构建过程
GitHub Actions 模拟了 Docker 容器的构建过程：

```yaml
# 构建 WebLLM 组件
cd optlite-webllm/webllm-components
npm run build

# 构建 OPTLite 组件
cd optlite-webllm/optlite-components
npm run build:prod
```

这会在 `optlite-components/build/` 目录下生成：
- `live.html` - 主要的编程界面
- `index.html` - 可视化界面
- `*.bundle.js` - 打包的 JavaScript 文件
- 其他静态资源

## 🌐 访问部署的网站

部署成功后，你可以通过以下 URL 访问：

```
https://[你的用户名].github.io/[仓库名]/
```

### 主要页面
- **主页**: `https://yourusername.github.io/OPT_Mentor/`
- **Live 模式**: `https://yourusername.github.io/OPT_Mentor/live.html`
- **可视化模式**: `https://yourusername.github.io/OPT_Mentor/index.html`

## 🔍 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本兼容性 (需要 22.x)
   - 确保所有依赖都正确安装
   - 查看 GitHub Actions 日志

2. **页面无法访问**
   - 确认 GitHub Pages 已启用
   - 检查仓库权限设置
   - 等待部署完成（可能需要几分钟）

3. **WebLLM 功能不可用**
   - 确保 AI-Model 服务器正在运行
   - 检查模型配置是否正确
   - 验证网络连接

### 调试步骤

1. 查看 GitHub Actions 运行日志
2. 检查浏览器控制台错误
3. 验证文件路径和配置
4. 测试本地构建

## 📝 自定义配置

### 修改 webpack 配置

编辑 `optlite-webllm/optlite-components/webpack.config.js`：

```javascript
// 添加新的 HTML 页面
new HtmlWebpackPlugin({
  filename: "new-page.html",
  title: 'New Page',
  chunks: ['new-chunk'],
  template: './js/template/new-page.html'
})
```

### 更改 Node.js 版本

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # 更改为其他版本
```

### 添加环境变量

```yaml
env:
  NODE_ENV: production
  CUSTOM_VAR: value
```

## 🔄 持续集成

### 自动测试

可以添加测试步骤：

```yaml
- name: Run tests
  run: |
    cd optlite-webllm/optlite-components
    npm test
```

### 代码质量检查

```yaml
- name: Lint code
  run: |
    cd optlite-webllm/optlite-components
    npm run lint
```

## 🐳 Docker 与 GitHub Actions 对比

### Docker 构建 (本地)
```bash
docker-compose up --build
```
- 生成文件位置: `/app/opt-mentor/optlite-components/build/`
- 包含完整的运行时环境
- 支持所有功能

### GitHub Actions 构建 (部署)
- 生成文件位置: `optlite-webllm/optlite-components/build/`
- 静态文件部署到 GitHub Pages
- 需要额外的服务器来支持完整功能

## 📊 监控和通知

### 部署状态通知

可以配置 Slack 或邮件通知：

```yaml
- name: Notify deployment
  if: always()
  run: |
    # 发送通知逻辑
```

### 性能监控

使用 GitHub Pages 分析功能监控网站性能。

## 🎯 最佳实践

1. **分支管理**: 使用 `main` 分支进行生产部署
2. **版本控制**: 为每个部署添加版本标签
3. **回滚策略**: 保留之前的部署版本
4. **安全考虑**: 不要在代码中硬编码敏感信息
5. **文档更新**: 及时更新部署文档

## 📞 支持

如果遇到问题，请：

1. 查看 GitHub Actions 日志
2. 检查项目文档
3. 提交 Issue 到仓库
4. 联系项目维护者

---

**注意**: 
- 确保你的仓库是公开的，或者你有 GitHub Pro 账户来使用私有仓库的 GitHub Pages
- GitHub Pages 部署的是静态文件，完整的 AI 功能需要运行 Docker 容器
- `live.html` 和 `index.html` 是由 webpack 自动生成的，不要手动修改 