// security.js - Комплексная система безопасности REVERAGE SS1
(function() {
    'use strict';

    // ========== 1. КОНФИГУРАЦИЯ БЕЗОПАСНОСТИ ==========
    const SECURITY_CONFIG = {
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 минут
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION: 15 * 60 * 1000, // 15 минут
        TOKEN_REFRESH_INTERVAL: 10 * 60 * 1000, // 10 минут
        ENCRYPTION_KEY: 'REVERAGE-SS1-SECURE-KEY-2026' // В продакшене использовать случайный ключ
    };

    // ========== 2. ГЕНЕРАЦИЯ И ВАЛИДАЦИЯ CSRF ТОКЕНОВ ==========
    class CSRFProtection {
        constructor() {
            this.tokenKey = 'csrf_token_reverage';
            this.tokenExpiry = 3600000; // 1 час
        }

        generateToken() {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2) + Date.now().toString(36);
            const token = btoa(JSON.stringify({
                t: timestamp,
                r: random,
                s: window.location.hostname
            }));
            
            const tokenData = {
                token: token,
                expires: timestamp + this.tokenExpiry
            };
            
            sessionStorage.setItem(this.tokenKey, JSON.stringify(tokenData));
            return token;
        }

        validateToken(token) {
            if (!token) return false;
            
            const storedData = sessionStorage.getItem(this.tokenKey);
            if (!storedData) return false;
            
            try {
                const parsed = JSON.parse(storedData);
                if (Date.now() > parsed.expires) {
                    sessionStorage.removeItem(this.tokenKey);
                    return false;
                }
                
                const decoded = JSON.parse(atob(token));
                return decoded.t && decoded.r && decoded.s === window.location.hostname;
            } catch(e) {
                return false;
            }
        }

        addTokenToForms() {
            const token = this.generateToken();
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                if (!form.querySelector('input[name="csrf_token"]')) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'csrf_token';
                    input.value = token;
                    form.appendChild(input);
                }
            });
        }
    }

    // ========== 3. ЗАЩИТА ОТ XSS ==========
    class XSSProtection {
        constructor() {
            this.blockedTags = ['script', 'iframe', 'object', 'embed', 'link', 'meta'];
            this.blockedAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'];
        }

        sanitizeHTML(str) {
            if (!str) return '';
            
            // Создаем временный элемент для санитизации
            const temp = document.createElement('div');
            temp.textContent = str;
            
            // Дополнительная проверка
            let sanitized = temp.innerHTML;
            
            // Удаляем опасные теги
            this.blockedTags.forEach(tag => {
                const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
                sanitized = sanitized.replace(regex, '');
                const regex2 = new RegExp(`<${tag}[^>]*/?>`, 'gi');
                sanitized = sanitized.replace(regex2, '');
            });
            
            // Удаляем опасные атрибуты
            this.blockedAttrs.forEach(attr => {
                const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
                sanitized = sanitized.replace(regex, '');
            });
            
            // Удаляем javascript: протокол
            sanitized = sanitized.replace(/javascript:/gi, '');
            sanitized = sanitized.replace(/data:text\/html/gi, '');
            
            return sanitized;
        }

        sanitizeInput(str) {
            if (!str) return '';
            return str
                .replace(/[&<>]/g, function(m) {
                    if (m === '&') return '&amp;';
                    if (m === '<') return '&lt;';
                    if (m === '>') return '&gt;';
                    return m;
                })
                .replace(/[\\"']/g, '\\$&')
                .replace(/\u0000/g, '');
        }

        monitorDOMChanges() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) { // Element node
                                // Проверяем наличие скриптов
                                if (node.tagName === 'SCRIPT' || node.tagName === 'IFRAME') {
                                    node.remove();
                                    this.logSecurityEvent('XSS_ATTEMPT_BLOCKED', 'Blocked malicious script');
                                }
                                
                                // Проверяем атрибуты
                                if (node.attributes) {
                                    for (let attr of node.attributes) {
                                        if (this.blockedAttrs.some(badAttr => attr.name.toLowerCase().includes(badAttr))) {
                                            node.removeAttribute(attr.name);
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: this.blockedAttrs
            });
        }
    }

    // ========== 4. ШИФРОВАНИЕ ДАННЫХ ==========
    class DataEncryption {
        constructor() {
            this.key = SECURITY_CONFIG.ENCRYPTION_KEY;
        }

        // Простое шифрование для localStorage (в продакшене использовать Web Crypto API)
        encrypt(data) {
            if (typeof data === 'object') {
                data = JSON.stringify(data);
            }
            
            let result = '';
            for (let i = 0; i < data.length; i++) {
                const charCode = data.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length);
                result += String.fromCharCode(charCode);
            }
            return btoa(result);
        }

        decrypt(encryptedData) {
            try {
                const decoded = atob(encryptedData);
                let result = '';
                for (let i = 0; i < decoded.length; i++) {
                    const charCode = decoded.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length);
                    result += String.fromCharCode(charCode);
                }
                return result;
            } catch(e) {
                return null;
            }
        }

        secureStorage() {
            // Перехватываем localStorage/sessionStorage для шифрования
            const originalSetItem = Storage.prototype.setItem;
            const originalGetItem = Storage.prototype.getItem;
            const encryptor = this;
            
            Storage.prototype.setItem = function(key, value) {
                if (key.includes('token') || key.includes('session') || key.includes('user')) {
                    value = encryptor.encrypt(value);
                }
                originalSetItem.call(this, key, value);
            };
            
            Storage.prototype.getItem = function(key) {
                let value = originalGetItem.call(this, key);
                if (key.includes('token') || key.includes('session') || key.includes('user')) {
                    if (value) {
                        const decrypted = encryptor.decrypt(value);
                        return decrypted;
                    }
                }
                return value;
            };
        }
    }

    // ========== 5. АУТЕНТИФИКАЦИЯ И СЕССИИ ==========
    class SessionManager {
        constructor() {
            this.sessionKey = 'reverage_secure_session';
            this.lastActivityKey = 'reverage_last_activity';
            this.failedAttemptsKey = 'reverage_failed_attempts';
            this.lockoutUntilKey = 'reverage_lockout_until';
        }

        init() {
            this.checkSession();
            this.startActivityMonitor();
            this.startAutoLogout();
        }

        checkSession() {
            const session = sessionStorage.getItem(this.sessionKey);
            const lastActivity = localStorage.getItem(this.lastActivityKey);
            
            if (session && lastActivity) {
                const timeSinceActivity = Date.now() - parseInt(lastActivity);
                if (timeSinceActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
                    this.destroySession();
                    return false;
                }
            }
            return true;
        }

        startActivityMonitor() {
            const events = ['click', 'keypress', 'mousemove', 'scroll', 'touchstart'];
            events.forEach(event => {
                document.addEventListener(event, () => {
                    localStorage.setItem(this.lastActivityKey, Date.now().toString());
                });
            });
        }

        startAutoLogout() {
            setInterval(() => {
                if (!this.checkSession()) {
                    if (window.location.pathname.includes('admin.html')) {
                        window.location.href = 'login.html';
                    }
                }
            }, 60000); // Проверка каждую минуту
        }

        destroySession() {
            sessionStorage.removeItem(this.sessionKey);
            localStorage.removeItem(this.lastActivityKey);
            
            // Очищаем все чувствительные данные
            const keysToRemove = [
                'reverage_products',
                'reverage_orders_admin',
                'reverage_users_admin',
                'reverage_activities'
            ];
            keysToRemove.forEach(key => {
                if (window.location.pathname.includes('admin.html')) {
                    localStorage.removeItem(key);
                }
            });
            
            this.logSecurityEvent('SESSION_EXPIRED', 'User session expired');
        }

        validateLogin(username, password) {
            // Проверка на блокировку
            const lockoutUntil = localStorage.getItem(this.lockoutUntilKey);
            if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
                const remaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000);
                throw new Error(`Аккаунт заблокирован на ${remaining} секунд`);
            }
            
            // Получаем количество неудачных попыток
            let attempts = parseInt(localStorage.getItem(this.failedAttemptsKey) || '0');
            
            if (attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
                const lockoutTime = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
                localStorage.setItem(this.lockoutUntilKey, lockoutTime.toString());
                throw new Error('Превышено количество попыток входа. Попробуйте позже.');
            }
            
            // Проверка логина (в реальном проекте - бэкенд)
            if (username === 'admin' && password === 'REVERAGE2026!') {
                // Успешный вход
                localStorage.removeItem(this.failedAttemptsKey);
                localStorage.removeItem(this.lockoutUntilKey);
                
                const sessionToken = btoa(JSON.stringify({
                    username: username,
                    timestamp: Date.now(),
                    fingerprint: this.getBrowserFingerprint()
                }));
                
                sessionStorage.setItem(this.sessionKey, sessionToken);
                localStorage.setItem(this.lastActivityKey, Date.now().toString());
                
                this.logSecurityEvent('LOGIN_SUCCESS', `Admin login from ${this.getClientIP()}`);
                return true;
            } else {
                // Неудачная попытка
                attempts++;
                localStorage.setItem(this.failedAttemptsKey, attempts.toString());
                this.logSecurityEvent('LOGIN_FAILED', `Failed login attempt ${attempts} for ${username}`);
                throw new Error('Неверное имя пользователя или пароль');
            }
        }

        getBrowserFingerprint() {
            const components = [
                navigator.userAgent,
                navigator.language,
                screen.colorDepth,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                navigator.hardwareConcurrency || 'unknown',
                navigator.deviceMemory || 'unknown'
            ];
            return btoa(components.join('|'));
        }

        getClientIP() {
            // В реальном проекте получать с сервера
            return 'client-ip-' + Math.random().toString(36);
        }

        logSecurityEvent(event, details) {
            const logs = JSON.parse(localStorage.getItem('reverage_security_logs') || '[]');
            logs.unshift({
                event: event,
                details: details,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
            
            // Храним только последние 100 записей
            if (logs.length > 100) logs.pop();
            localStorage.setItem('reverage_security_logs', JSON.stringify(logs));
            
            // Отправка на сервер (в реальном проекте)
            console.warn(`[SECURITY] ${event}: ${details}`);
        }
    }

    // ========== 6. ЗАЩИТА ОТ CSRF ДЛЯ FETCH ЗАПРОСОВ ==========
    class FetchInterceptor {
        constructor(csrfProtection) {
            this.csrf = csrfProtection;
            this.intercept();
        }

        intercept() {
            const originalFetch = window.fetch;
            const csrfInstance = this.csrf;
            
            window.fetch = function(url, options = {}) {
                // Добавляем CSRF токен к запросам
                if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
                    const token = csrfInstance.generateToken();
                    options.headers = options.headers || {};
                    options.headers['X-CSRF-Token'] = token;
                    options.headers['X-Requested-With'] = 'XMLHttpRequest';
                }
                
                // Добавляем security headers
                options.headers = options.headers || {};
                options.headers['X-Content-Type-Options'] = 'nosniff';
                options.headers['X-Frame-Options'] = 'DENY';
                
                return originalFetch.call(this, url, options);
            };
        }
    }

    // ========== 7. ЗАЩИТА ОТ ИНЪЕКЦИЙ ==========
    class InjectionProtection {
        constructor() {
            this.blockedPatterns = [
                /<script/i,
                /javascript:/i,
                /on\w+\s*=/i,
                /<\/?[^>]+>/i,
                /SELECT.*FROM/i,
                /INSERT.*INTO/i,
                /DELETE.*FROM/i,
                /UPDATE.*SET/i,
                /DROP\s+TABLE/i,
                /UNION\s+SELECT/i
            ];
        }

        validateInput(value, fieldName = 'unknown') {
            if (!value) return true;
            
            const stringValue = String(value);
            
            for (const pattern of this.blockedPatterns) {
                if (pattern.test(stringValue)) {
                    this.logSecurityEvent('INJECTION_ATTEMPT_BLOCKED', `Pattern ${pattern} detected in ${fieldName}`);
                    return false;
                }
            }
            
            return true;
        }

        monitorConsole() {
            // Защита от консольных атак
            const originalConsoleLog = console.log;
            const originalConsoleError = console.error;
            const securityInstance = this;
            
            console.log = function() {
                const args = Array.from(arguments);
                const hasSensitive = args.some(arg => 
                    String(arg).includes('token') || 
                    String(arg).includes('password') ||
                    String(arg).includes('key')
                );
                
                if (hasSensitive && window.location.pathname.includes('admin.html')) {
                    securityInstance.logSecurityEvent('CONSOLE_LEAK_ATTEMPT', 'Attempt to log sensitive data');
                    return;
                }
                
                originalConsoleLog.apply(console, args);
            };
        }
    }

    // ========== 8. БЛОКИРОВКА ИНСТРУМЕНТОВ РАЗРАБОТЧИКА ==========
    class DevToolsBlocker {
        constructor() {
            this.detectDevTools();
        }

        detectDevTools() {
            const threshold = 160;
            
            const checkDevTools = () => {
                const widthDiff = window.outerWidth - window.innerWidth > threshold;
                const heightDiff = window.outerHeight - window.innerHeight > threshold;
                
                if (widthDiff || heightDiff) {
                    this.blockAccess();
                }
            };
            
            setInterval(checkDevTools, 1000);
            
            // Проверка через console.log
            const originalConsole = console.log;
            console.log = function() {
                if (arguments.length > 0 && arguments[0] === 'devtools') {
                    this.blockAccess();
                }
                originalConsole.apply(console, arguments);
            }.bind(this);
        }

        blockAccess() {
            // Очищаем все данные
            localStorage.clear();
            sessionStorage.clear();
            
            // Блокируем интерфейс
            document.body.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: black;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    font-family: monospace;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <h1>🔒 ДОСТУП ЗАБЛОКИРОВАН</h1>
                        <p>Обнаружены инструменты разработчика.<br>Пожалуйста, закройте DevTools для продолжения работы.</p>
                    </div>
                </div>
            `;
            
            this.logSecurityEvent('DEVTOOLS_DETECTED', 'User attempted to open DevTools');
        }

        logSecurityEvent(event, details) {
            console.warn(`[SECURITY] ${event}: ${details}`);
        }
    }

    // ========== 9. ЗАЩИТА КОММУНИКАЦИЙ (HTTPS enforce) ==========
    class HTTPSEnforcer {
        constructor() {
            this.enforce();
        }

        enforce() {
            if (window.location.protocol === 'http:' && 
                window.location.hostname !== 'localhost' &&
                !window.location.hostname.includes('127.0.0.1')) {
                window.location.href = 'https://' + window.location.href.substring(7);
            }
        }
    }

    // ========== 10. ЗАЩИТА ОТ КЛИКДЖЕКИНГА ==========
    class ClickjackingProtection {
        constructor() {
            if (window.self !== window.top) {
                window.top.location = window.self.location;
            }
            
            // Добавляем заголовок X-Frame-Options
            const meta = document.createElement('meta');
            meta.httpEquiv = 'X-Frame-Options';
            meta.content = 'DENY';
            document.head.appendChild(meta);
        }
    }

    // ========== 11. ВАЛИДАЦИЯ И САНИТИЗАЦИЯ ВВОДА ДЛЯ ВСЕХ ФОРМ ==========
    class InputSanitizer {
        constructor(xssProtection, injectionProtection) {
            this.xss = xssProtection;
            this.injection = injectionProtection;
            this.init();
        }

        init() {
            this.interceptFormSubmissions();
            this.sanitizeAllInputs();
        }

        interceptFormSubmissions() {
            document.addEventListener('submit', (e) => {
                const form = e.target;
                const inputs = form.querySelectorAll('input, textarea, select');
                
                for (let input of inputs) {
                    if (input.value) {
                        // Санитизация XSS
                        input.value = this.xss.sanitizeInput(input.value);
                        
                        // Проверка на инъекции
                        if (!this.injection.validateInput(input.value, input.name)) {
                            e.preventDefault();
                            alert('Обнаружена попытка внедрения вредоносного кода! Действие отменено.');
                            this.injection.logSecurityEvent('FORM_INJECTION_BLOCKED', `Field: ${input.name}`);
                            return false;
                        }
                    }
                }
            });
        }

        sanitizeAllInputs() {
            // Real-time санитизация
            document.addEventListener('input', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    const originalValue = e.target.value;
                    const sanitized = this.xss.sanitizeInput(originalValue);
                    if (originalValue !== sanitized) {
                        e.target.value = sanitized;
                    }
                }
            });
        }
    }

    // ========== 12. ЛОГГЕР БЕЗОПАСНОСТИ С ОТПРАВКОЙ ==========
    class SecurityLogger {
        static log(event, data = {}) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                event: event,
                data: data,
                url: window.location.href,
                userAgent: navigator.userAgent,
                fingerprint: this.getFingerprint()
            };
            
            // Сохраняем в localStorage
            const logs = JSON.parse(localStorage.getItem('security_audit_log') || '[]');
            logs.push(logEntry);
            
            // Храним только последние 500 записей
            if (logs.length > 500) logs.shift();
            localStorage.setItem('security_audit_log', JSON.stringify(logs));
            
            // В реальном проекте отправлять на сервер
            console.warn(`[SECURITY_AUDIT] ${event}`, data);
        }

        static getFingerprint() {
            const components = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset()
            ];
            return btoa(components.join('|')).substring(0, 50);
        }
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ВСЕХ СИСТЕМ ==========
    function initSecuritySystems() {
        // Проверяем, не запущена ли уже защита
        if (window.__SECURITY_INITIALIZED__) return;
        window.__SECURITY_INITIALIZED__ = true;
        
        // Инициализируем все модули
        const csrf = new CSRFProtection();
        const xss = new XSSProtection();
        const encryption = new DataEncryption();
        const session = new SessionManager();
        const injection = new InjectionProtection();
        
        // Запускаем защиты
        xss.monitorDOMChanges();
        encryption.secureStorage();
        session.init();
        new FetchInterceptor(csrf);
        new DevToolsBlocker();
        new HTTPSEnforcer();
        new ClickjackingProtection();
        injection.monitorConsole();
        new InputSanitizer(xss, injection);
        
        // Добавляем CSRF токены на все формы
        csrf.addTokenToForms();
        
        // Периодическая проверка целостности
        setInterval(() => {
            csrf.addTokenToForms();
            session.checkSession();
        }, 60000);
        
        // Логируем инициализацию
        SecurityLogger.log('SECURITY_SYSTEM_INITIALIZED', {
            timestamp: new Date().toISOString(),
            protections: ['XSS', 'CSRF', 'Encryption', 'Session', 'Injection', 'DevTools']
        });
        
        console.log('✅ REVERAGE SS1 Security System Active');
    }

    // Экспортируем для использования в админке
    window.ReverageSecurity = {
        CSRF: CSRFProtection,
        XSS: XSSProtection,
        Encryption: DataEncryption,
        Session: SessionManager,
        SecurityLogger: SecurityLogger,
        validateLogin: (user, pass) => new SessionManager().validateLogin(user, pass)
    };
    
    // Запускаем при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSecuritySystems);
    } else {
        initSecuritySystems();
    }
})();