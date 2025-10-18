// KV Namespace binding should be named 'PROFILES_KV'

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

const SECURITY_HEADERS = {
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
};

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

const SESSION_PREFIX = 'session:';

// Utility Classes
class SessionManager {
    constructor(kv) {
        this.kv = kv;
    }

    async createSession(username) {
        const sessionToken = crypto.randomUUID();
        const sessionData = {
            username,
            created: Date.now(),
            expires: Date.now() + (CONFIG.auth.sessionDuration * 1000)
        };

        await this.kv.put(
            `${SESSION_PREFIX}${sessionToken}`,
            JSON.stringify(sessionData),
            { expirationTtl: CONFIG.auth.sessionDuration }
        );

        return sessionToken;
    }

    async validateSession(sessionToken) {
        if (!sessionToken) return null;

        const sessionData = await this.kv.get(`${SESSION_PREFIX}${sessionToken}`);
        if (!sessionData) return null;

        const session = JSON.parse(sessionData);
        return session.expires > Date.now() ? session : null;
    }

    async destroySession(sessionToken) {
        if (sessionToken) {
            await this.kv.delete(`${SESSION_PREFIX}${sessionToken}`);
        }
    }
}

class ProfilesApp {
    constructor() {
        this.router = new Router();
        this.sessionManager = new SessionManager(PROFILES_KV);
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/', this.handleHome.bind(this));
        this.router.get('/admin', this.handleAdminProfile.bind(this));
        this.router.get('/profile/:id', this.handleProfileDetail.bind(this));
        this.router.post('/api/login', this.handleLogin.bind(this));
        this.router.post('/api/logout', this.handleLogout.bind(this));
        this.router.get('/api/session', this.handleCheckSession.bind(this));
        this.router.post('/api/profiles', this.handleAddProfile.bind(this));
    }

    async handleHome(request) {
        try {
            const profiles = await PROFILES_KV.get('profiles', 'json') || [];
            const content = this.renderProfilesList(profiles);
            return this.createResponse(
                HTML_TEMPLATE.replace('${CONTENT}', content),
                200,
                { 'Content-Type': 'text/html' }
            );
        } catch (error) {
            console.error('Home page error:', error);
            return this.createErrorResponse();
        }
    }

    async handleAdminProfile(request) {
        const content = this.renderAdminProfiles();
        return this.createResponse(
            HTML_TEMPLATE.replace('${CONTENT}', content),
            200,
            { 'Content-Type': 'text/html' }
        );
    }

    async handleProfileDetail(request, params) {
        try {
            const profiles = await PROFILES_KV.get('profiles', 'json') || [];
            const profile = profiles.find(p => p.id.toString() === params.id);

            if (!profile) {
                return this.createErrorResponse('个人资料未找到', 404);
            }

            const content = this.renderProfileDetail(profile);
            return this.createResponse(
                HTML_TEMPLATE.replace('${CONTENT}', content),
                200,
                { 'Content-Type': 'text/html' }
            );
        } catch (error) {
            console.error('Profile detail error:', error);
            return this.createErrorResponse();
        }
    }

    async handleLogin(request) {
        try {
            const { username, password } = await request.json();

            if (username === CONFIG.auth.username && password === CONFIG.auth.password) {
                const sessionToken = await this.sessionManager.createSession(username);
                return this.createResponse(JSON.stringify({
                    success: true,
                    token: sessionToken,
                    expiresIn: CONFIG.auth.sessionDuration
                }), 200, {
                    'Content-Type': 'application/json',
                    'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${CONFIG.auth.sessionDuration}`
                });
            }

            return this.createErrorResponse('用户名或密码错误', 401);
        } catch (error) {
            console.error('Login error:', error);
            return this.createErrorResponse();
        }
    }

    async handleLogout(request) {
        const sessionToken = this.getSessionToken(request);
        if (sessionToken) {
            await this.sessionManager.destroySession(sessionToken);
        }

        return this.createResponse(JSON.stringify({ success: true }), 200, {
            'Content-Type': 'application/json',
            'Set-Cookie': 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
        });
    }

    async handleCheckSession(request) {
        const sessionToken = this.getSessionToken(request);
        const session = await this.sessionManager.validateSession(sessionToken);

        if (!session) {
            return this.createResponse(JSON.stringify({ authenticated: false }), 200, {
                'Content-Type': 'application/json'
            });
        }

        return this.createResponse(JSON.stringify({
            authenticated: true,
            username: session.username
        }), 200, {
            'Content-Type': 'application/json'
        });
    }

    async handleAddProfile(request) {
        const isAuthenticated = await this.validateSession(request);
        if (!isAuthenticated) {
            return this.createErrorResponse('未授权的访问', 401);
        }

        try {
            const profile = await request.json();
            const profiles = await PROFILES_KV.get('profiles', 'json') || [];
            profiles.push({
                id: Date.now().toString(),
                ...profile
            });
            await PROFILES_KV.put('profiles', JSON.stringify(profiles));

            return this.createResponse(JSON.stringify({
                success: true,
                profile: profile
            }), 200, { 'Content-Type': 'application/json' });
        } catch (error) {
            console.error('Add profile error:', error);
            return this.createErrorResponse();
        }
    }

    // Utilities
    createResponse(content, status = 200, additionalHeaders = {}) {
        return new Response(content, {
            status,
            headers: {
                ...SECURITY_HEADERS,
                ...additionalHeaders
            }
        });
    }

    createErrorResponse(message = '服务器错误', status = 500) {
        return this.createResponse(
            JSON.stringify({ success: false, error: message }),
            status,
            { 'Content-Type': 'application/json' }
        );
    }

    getSessionToken(request) {
        const cookies = request.headers.get('Cookie') || '';
        const match = cookies.match(/session=([^;]+)/);
        return match ? match[1] : null;
    }

    async validateSession(request) {
        const sessionToken = this.getSessionToken(request);
        return await this.sessionManager.validateSession(sessionToken);
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

    renderAdminProfiles() {
        return `
            <div class="max-w-4xl mx-auto">
                <h2 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">管理员团队</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    ${ADMIN_PROFILES.map(admin => `
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
}

class Router {
    constructor() {
        this.routes = new Map();
    }

    get(path, handler) {
        this.routes.set(`GET:${path}`, { handler, params: this.extractParams(path) });
    }

    post(path, handler) {
        this.routes.set(`POST:${path}`, { handler, params: this.extractParams(path) });
    }

    async handle(request) {
        const url = new URL(request.url);
        const route = `${request.method}:${url.pathname}`;
        const routeEntry = Array.from(this.routes.keys()).find(r => this.matchRoute(r, route));

        if (!routeEntry) {
            return new Response('Not Found', { status: 404 });
        }

        const { handler, params } = this.routes.get(routeEntry);
        const paramValues = this.extractParamValues(routeEntry, route);
        const paramObject = params.reduce((obj, param, index) => {
            obj[param] = paramValues[index];
            return obj;
        }, {});

        return await handler(request, paramObject);
    }

    matchRoute(routePattern, route) {
        const pattern = new RegExp('^' + routePattern.replace(/:[^\/]+/g, '([^/]+)') + '$');
        return pattern.test(route);
    }

    extractParams(routePattern) {
        return (routePattern.match(/:[^\/]+/g) || []).map(param => param.substring(1));
    }

    extractParamValues(routePattern, route) {
        const pattern = new RegExp('^' + routePattern.replace(/:[^\/]+/g, '([^/]+)') + '$');
        const match = route.match(pattern);
        return match ? match.slice(1) : [];
    }
}

// Main Worker Event Listener
addEventListener('fetch', event => {
    const app = new ProfilesApp();
    event.respondWith(app.router.handle(event.request));
});