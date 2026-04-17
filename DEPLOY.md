# 合拍社 Vercel 部署指南

## 项目信息
- **项目名称**: 合拍社匹克球场馆预订系统
- **技术栈**: React + TypeScript + Tailwind CSS + Supabase
- **默认语言**: 英文（支持中英文切换）

## 部署步骤

### 1. 准备代码
确保代码已推送到 GitHub/GitLab 仓库。

### 2. 注册 Vercel
访问 [vercel.com](https://vercel.com) 使用 GitHub 账号登录。

### 3. 导入项目
1. 点击 "Add New Project"
2. 选择 "Import Git Repository"
3. 选择你的代码仓库

### 4. 配置构建设置
| 配置项 | 值 |
|--------|-----|
| Framework Preset | Other |
| Build Command | `pnpm run build` |
| Output Directory | `dist` |
| Install Command | `pnpm install` |

### 5. 环境变量配置
在 Vercel 项目设置中添加以下环境变量：

```
SUPABASE_URL=你的Supabase项目URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

### 6. 部署
点击 "Deploy" 按钮，等待构建完成。

## 自定义域名配置

### 添加域名
1. 进入项目 Dashboard → Settings → Domains
2. 输入你的域名（如 `hepaishe.com`）
3. 点击 "Add"

### DNS 配置
在域名服务商处添加以下 DNS 记录：

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

或使用 Vercel 推荐的 DNS 配置：
```
CNAME    www    cname.vercel-dns.com
```

### 验证
等待 DNS 生效（通常几分钟到几小时），Vercel 会自动配置 SSL 证书。

## 项目结构
```
├── dist/              # 构建输出目录
├── src/
│   ├── components/    # 组件
│   ├── pages/         # 页面
│   ├── i18n/          # 国际化配置
│   └── supabase/      # 数据库客户端
├── vercel.json        # Vercel 配置
└── package.json       # 依赖配置
```

## 功能特性
- 中英文双语切换（默认英文）
- 8个匹克球场地预订
- 用户登录/注册
- 预订管理
- 响应式设计（支持手机/平板/电脑）

## 注意事项
- 首次部署后需要配置 Supabase 数据库
- 确保数据库表已创建（courts, bookings, profiles）
- 图片使用 AI 生成的 SVG 插图，无需外部图片资源
