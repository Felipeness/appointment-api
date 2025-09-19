"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SecurityMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
let SecurityMiddleware = SecurityMiddleware_1 = class SecurityMiddleware {
    logger = new common_1.Logger(SecurityMiddleware_1.name);
    helmetMiddleware;
    constructor() {
        this.helmetMiddleware = (0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
                    fontSrc: ["'self'", 'fonts.gstatic.com'],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    scriptSrc: ["'self'"],
                    connectSrc: ["'self'"],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    manifestSrc: ["'self'"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            frameguard: {
                action: 'deny',
            },
            noSniff: true,
            xssFilter: true,
            referrerPolicy: {
                policy: 'strict-origin-when-cross-origin',
            },
            hidePoweredBy: true,
            dnsPrefetchControl: {
                allow: false,
            },
            permittedCrossDomainPolicies: false,
        });
    }
    use(req, res, next) {
        this.helmetMiddleware(req, res, (err) => {
            if (err) {
                this.logger.error('Helmet middleware error', err);
                return next(err);
            }
            this.addCustomSecurityHeaders(req, res);
            this.logSecurityEvents(req);
            next();
        });
    }
    addCustomSecurityHeaders(req, res) {
        res.setHeader('X-API-Version', '1.0');
        res.setHeader('X-Request-ID', req.headers['x-request-id'] || this.generateRequestId());
        if (this.isSensitiveEndpoint(req.path)) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        res.setHeader('X-Rate-Limit-Policy', 'standard');
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        res.setHeader('X-Download-Options', 'noopen');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    }
    logSecurityEvents(req) {
        const suspiciousIndicators = this.detectSuspiciousActivity(req);
        if (suspiciousIndicators.length > 0) {
            this.logger.warn('Suspicious request detected', {
                ip: this.getClientIP(req),
                userAgent: req.headers['user-agent'],
                path: req.path,
                method: req.method,
                indicators: suspiciousIndicators,
                headers: this.sanitizeHeaders(req.headers),
            });
        }
    }
    detectSuspiciousActivity(req) {
        const indicators = [];
        const path = req.path.toLowerCase();
        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        const query = JSON.stringify(req.query).toLowerCase();
        const sqlPatterns = [
            'union select',
            'drop table',
            'insert into',
            'delete from',
            'update set',
            "' or '1'='1",
            "' or 1=1",
            '-- ',
            '/*',
        ];
        if (sqlPatterns.some((pattern) => path.includes(pattern) || query.includes(pattern))) {
            indicators.push('sql_injection_attempt');
        }
        const xssPatterns = [
            '<script',
            'javascript:',
            'onerror=',
            'onload=',
            'eval(',
            'document.cookie',
        ];
        if (xssPatterns.some((pattern) => path.includes(pattern) || query.includes(pattern))) {
            indicators.push('xss_attempt');
        }
        const pathTraversalPatterns = [
            '../',
            '..\\',
            '/etc/passwd',
            '/etc/shadow',
            'windows/system32',
        ];
        if (pathTraversalPatterns.some((pattern) => path.includes(pattern))) {
            indicators.push('path_traversal_attempt');
        }
        const scannerPatterns = [
            'nikto',
            'sqlmap',
            'nessus',
            'burp',
            'acunetix',
            'nmap',
            'masscan',
        ];
        if (scannerPatterns.some((pattern) => userAgent.includes(pattern))) {
            indicators.push('vulnerability_scanner');
        }
        const botPatterns = [
            'bot',
            'crawler',
            'spider',
            'scraper',
            'curl',
            'wget',
            'python-requests',
        ];
        if (!userAgent ||
            botPatterns.some((pattern) => userAgent.includes(pattern))) {
            indicators.push('automated_request');
        }
        const sensitiveFiles = [
            '.env',
            '.git',
            'config',
            'database',
            'admin',
            'wp-admin',
            'phpmyadmin',
            'backup',
            '.htaccess',
            'web.config',
        ];
        if (sensitiveFiles.some((file) => path.includes(file))) {
            indicators.push('sensitive_file_access');
        }
        const contentLength = parseInt(req.headers['content-length'] || '0');
        if (contentLength > 10 * 1024 * 1024) {
            indicators.push('large_payload');
        }
        const unusualMethods = ['TRACE', 'OPTIONS', 'HEAD'];
        if (unusualMethods.includes(req.method)) {
            indicators.push('unusual_http_method');
        }
        return indicators;
    }
    isSensitiveEndpoint(path) {
        const sensitivePatterns = [
            '/auth',
            '/login',
            '/password',
            '/admin',
            '/user',
            '/profile',
            '/settings',
            '/api/v',
        ];
        return sensitivePatterns.some((pattern) => path.includes(pattern));
    }
    getClientIP(req) {
        return (req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.ip ||
            'unknown');
    }
    generateRequestId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        const sensitiveHeaders = [
            'authorization',
            'cookie',
            'x-api-key',
            'x-auth-token',
            'session-id',
        ];
        sensitiveHeaders.forEach((header) => {
            if (header in sanitized) {
                sanitized[header] = '[REDACTED]';
            }
        });
        return sanitized;
    }
};
exports.SecurityMiddleware = SecurityMiddleware;
exports.SecurityMiddleware = SecurityMiddleware = SecurityMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SecurityMiddleware);
//# sourceMappingURL=security.middleware.js.map