// KV Namespace binding should be named 'PROFILES_KV'

// HTML Templates
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>人物介绍网站</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        .custom-bg {
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
        }
    </style>
</head>
<body class="bg-white dark:bg-gray-900 transition-colors duration-200 custom-bg">
    <div class="container mx-auto px-4">
        <!-- Header -->
        <header class="py-6 flex justify-between items-center">
            <!-- Admin Avatars -->
            <div class="flex space-x-4">
                ${ADMIN_AVATARS}
            </div>
            
            <!-- Theme and Background Controls -->
            <div class="flex space-x-4 items-center">
                <input type="file" 
                       id="bgInput" 
                       accept="image/*" 
                       class="hidden" 
                       onchange="handleBackgroundChange(event)">
                <button onclick="document.getElementById('bgInput').click()" 
                        class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm">
                    更换背景
                </button>
                <button id="themeToggle" class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path class="dark:hidden" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
                        <path class="hidden dark:block" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                    </svg>
                </button>
            </div>
        </header>

        <!-- Main Content -->
        <main class="py-8">
            ${CONTENT}
        </main>

        <!-- Footer -->
        <footer class="fixed bottom-0 w-full bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-4">
            <div class="container mx-auto px-4 flex justify-between items-center">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    © 2025 All Rights Reserved
                </div>
                <div class="flex space-x-4">
                    <a href="https://github.com/your-repo" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        GitHub
                    </a>
                    <button id="loginBtn" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        登录
                    </button>
                </div>
            </div>
        </footer>
    </div>

    <!-- Scripts -->
    <script>
        // Theme Toggle
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;
        
        themeToggle.addEventListener('click', () => {
            html.classList.toggle('dark');
            localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
        });

        // Initialize theme
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }

        // Background Change Handler
        function handleBackgroundChange(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.body.style.backgroundImage = 'url(' + e.target.result + ')';
                    localStorage.setItem('backgroundImage', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }

        // Initialize background
        const savedBg = localStorage.getItem('backgroundImage');
        if (savedBg) {
            document.body.style.backgroundImage = 'url(' + savedBg + ')';
        }
    </script>
</body>
</html>
`;

// Admin profile data
const ADMINS = [
    {
        id: 1,
        name: "管理员1",
        avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=admin1",
        contact: "admin1@example.com",
        bio: "网站管理员介绍1"
    },
    {
        id: 2,
        name: "管理员2",
        avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=admin2",
        contact: "admin2@example.com",
        bio: "网站管理员介绍2"
    },
    {
        id: 3,
        name: "管理员3",
        avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=admin3",
        contact: "admin3@example.com",
        bio: "网站管理员介绍3"
    }
];

class ProfilesApp {
    constructor() {
        this.router = new Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/', this.handleHome.bind(this));
        this.router.get('/admin', this.handleAdminProfile.bind(this));
        this.router.get('/profile/:id', this.handleProfileDetail.bind(this));
        this.router.post('/api/login', this.handleLogin.bind(this));
        this.router.post('/api/profiles', this.handleAddProfile.bind(this));
    }

    async handleHome(request) {
        const profiles = await PROFILES_KV.get('profiles', 'json') || [];
        const content = this.renderProfilesList(profiles);
        return new Response(HTML_TEMPLATE.replace('${CONTENT}', content), {
            headers: { 'Content-Type': 'text/html' },
        });
    }

    async handleProfileDetail(request, params) {
        const profiles = await PROFILES_KV.get('profiles', 'json') || [];
        const profile = profiles.find(p => p.id.toString() === params.id);
        
        if (!profile) {
            return new Response('Profile not found', { status: 404 });
        }

        const content = this.renderProfileDetail(profile);
        return new Response(HTML_TEMPLATE.replace('${CONTENT}', content), {
            headers: { 'Content-Type': 'text/html' },
        });
    }

    renderProfilesList(profiles) {
        return `
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                ${profiles.map(profile => `
                    <a href="/profile/${profile.id}" class="block">
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                            <img src="${profile.avatar}" alt="${profile.name}" class="w-24 h-24 rounded-full mx-auto mb-4">
                            <h3 class="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">${profile.name}</h3>
                            <div class="flex flex-wrap justify-center gap-2">
                                ${profile.tags.map(tag => `
                                    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm">
                                        ${tag}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;
    }

    renderProfileDetail(profile) {
        return `
            <div class="max-w-2xl mx-auto">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <img src="${profile.avatar}" alt="${profile.name}" class="w-32 h-32 rounded-full mx-auto mb-6">
                    <h2 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">${profile.name}</h2>
                    <p class="text-gray-600 dark:text-gray-400 text-center mb-4">${profile.contact}</p>
                    <div class="flex flex-wrap justify-center gap-2 mb-6">
                        ${profile.tags.map(tag => `
                            <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm">
                                ${tag}
                            </span>
                        `).join('')}
                    </div>
                    <div class="prose dark:prose-invert mx-auto">
                        <h3 class="text-lg font-semibold mb-2">个人事迹</h3>
                        <p class="text-gray-700 dark:text-gray-300">${profile.achievements}</p>
                    </div>
                </div>
                <div class="mt-6 text-center">
                    <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">返回列表</a>
                </div>
            </div>
        `;
    }

    renderAdminProfiles() {
        return `
            <div class="max-w-4xl mx-auto">
                <h2 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">管理员团队</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    ${ADMINS.map(admin => `
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                            <img src="${admin.avatar}" alt="${admin.name}" class="w-32 h-32 rounded-full mx-auto mb-4">
                            <h3 class="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">${admin.name}</h3>
                            <p class="text-gray-600 dark:text-gray-400 text-center mb-4">${admin.contact}</p>
                            <p class="text-gray-700 dark:text-gray-300 text-center">${admin.bio}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ... 其他方法保持不变
}

class Router {
    constructor() {
        this.routes = new Map();
    }

    get(path, handler) {
        this.routes.set(`GET:${path}`, {
            handler,
            params: (path.match(/:[a-zA-Z]+/g) || []).map(p => p.substring(1))
        });
    }

    post(path, handler) {
        this.routes.set(`POST:${path}`, {
            handler,
            params: []
        });
    }

    async handle(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // 遍历所有路由找到匹配的
        for (const [routePath, { handler, params }] of this.routes) {
            const [method, routePattern] = routePath.split(':');
            if (request.method === method) {
                // 转换路由模式为正则表达式
                const pattern = new RegExp(
                    '^' + routePattern.replace(/:[a-zA-Z]+/g, '([^/]+)') + '$'
                );
                const match = path.match(pattern);
                
                if (match) {
                    // 提取参数
                    const paramValues = match.slice(1);
                    const paramObject = {};
                    params.forEach((param, index) => {
                        paramObject[param] = paramValues[index];
                    });
                    
                    return await handler(request, paramObject);
                }
            }
        }

        return new Response('Not Found', { status: 404 });
    }
}

// Main worker event handler
addEventListener('fetch', event => {
    const app = new ProfilesApp();
    event.respondWith(app.router.handle(event.request));
});