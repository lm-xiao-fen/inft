# 人物介绍网站

## 项目介绍
这是一个基于 Cloudflare Workers 的动态人物介绍网站，支持以下功能：
- 首页显示排行榜式的人物列表（头像、名字、标签）
- 点击人物卡片后进入详情页面，展示完整的个人信息（头像、名字、联系方式、标签、事迹）
- 支持白天/夜晚模式切换
- 管理员展示区，支持跳转到管理员介绍页面
- 支持自定义背景图片功能（本地上传图片）
- 使用 Cloudflare KV 存储数据，无需额外存储费用
- 支持简单的登录认证机制

## 部署指南
1. 注册并登录 [Cloudflare Workers](https://workers.cloudflare.com/)
2. 创建一个新的 Workers：
   - 打开 Cloudflare Dashboard，选择 "Workers" > "Create a Service"
   - 选择 "HTTP Handler" 类型，点击 "Create Service"。
3. 创建 KV 命名空间：
   - 打开 Workers 的设置页面，选择 "KV" > "Add Namespace"
   - 命名为 `PROFILES_KV`，并绑定到 Workers。
4. 上传 `worker.js` 作为 Worker 的主文件
5. 保存并部署

## 添加新个人资料
通过 API 添加新的个人资料：
```bash
curl -X POST https://your-worker.workers.dev/api/profiles \
  -H "Authorization: Bearer your-auth-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "timestamp",
    "name": "示例名字",
    "avatar": "https://example.com/avatar.jpg",
    "contact": "example@email.com",
    "tags": ["标签1", "标签2"],
    "achievements": "个人事迹描述"
  }'
```

### 数据结构
在 Cloudflare KV 中存储的 `profiles` 数据结构如下：
```bash
[
  {
    "id": "timestamp",
    "name": "示例名字",
    "avatar": "https://example.com/avatar.jpg",
    "contact": "example@email.com",
    "tags": ["标签1", "标签2"],
    "achievements": "个人事迹描述"
  }
]
```


## 功能演示
### 首页
- 展示排行榜式的人物列表（头像、名字、标签）
- 支持白天/夜晚模式切换
- 自定义背景上传

### 人物详情页面
- 显示人物的完整信息（头像、名字、联系方式、标签、事迹）
- 返回按钮可以回到列表页面

### 管理员展示区
- 左上角展示三位管理员的头像，点击头像进入管理员介绍页面

## 注意事项
### 用户&密码
- 用户和密码是写死在workers中的，请在上传前修改好
```bash
// Constants and Configurations
const CONFIG = {
    auth: {
        username: 'admin',
        password: 'password', // 请替换为安全的密码
        sessionDuration: 7200 // 会话有效期（秒）
    },
    api: {
        maxRequestSize: 1024 * 1024, // 1MB
        rateLimit: {
            maxRequests: 100,
            windowMs: 60000 // 1分钟
        }
    }
};
```
- 以下是默认的默认账号密码
- 账号`admin`
- 密码`password`

### 管理员展示页
- 注意:管理员介绍是写死在workers中的，请在上传时就编辑好
```bash         
const ADMIN_PROFILES = [
    {
        id: 1,
        name: "Yuki(事例)",
        avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=yuki",
        contact: "yuki@example.com",
        bio: "前端开发工程师，负责用户界面设计与实现"
    },
    {
        id: 2,
        name: "小风(事例)",
        avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=xiaofen",
        contact: "xiaofeng@example.com",
        bio: "全栈开发工程师，负责系统架构与后端实现"
    },
    {
        id: 3,
        name: "Nova(事例)",
        avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=nova",
        contact: "nova@example.com",
        bio: "UI/UX设计师，负责用户体验与界面设计"
    }
];
```
### 其他注意事项
1. 确保 KV 命名空间绑定名称为 `PROFILES_KV`
2. 修改 `worker.js` 中的密钥和管理员信息
3. 自定义背景图片设置会保存在浏览器的 localStorage 中，仅对当前设备和浏览器生效
4. 本项目仅供学习和个人使用，如需商用请联系作者
