# 🛡️ Guia de Proteção de Segurança - Appointment API

Este guia apresenta a implementação completa de proteção contra ataques DDoS, rate limiting avançado, e medidas de segurança enterprise para a Appointment API.

## 📋 **Visão Geral**

Nossa implementação de segurança multicamadas protege contra:
- ✅ **Ataques DDoS** (Distributed Denial of Service)
- ✅ **Rate Limiting** por IP, usuário e endpoint
- ✅ **Requisições maliciosas** (SQL Injection, XSS, Path Traversal)
- ✅ **Scanners de vulnerabilidades** 
- ✅ **Bots e crawlers maliciosos**
- ✅ **Ataques de força bruta**

---

## 🚀 **Componentes Implementados**

### 1. **DDoS Protection Middleware**
Proteção avançada contra ataques distribuídos com detecção progressiva:

```typescript
// Configuração automática baseada no ambiente
const config = {
  enabled: process.env.NODE_ENV === 'production',
  maxRequests: 100,        // Requests normais por minuto
  suspiciousThreshold: 200, // Limite para atividade suspeita  
  attackThreshold: 500,    // Limite para detecção de ataque
  windowMs: 60000,         // Janela de 1 minuto
};
```

**Recursos:**
- **Progressive Blocking**: Escalação automática de medidas restritivas
- **IP Whitelist/Blacklist**: Gerenciamento dinâmico de IPs
- **Attack Pattern Detection**: Identificação de padrões maliciosos
- **Automatic Alerts**: Notificações em tempo real de ataques

### 2. **Rate Limiting Guard**
Rate limiting flexível por endpoint com `rate-limiter-flexible`:

```typescript
@RateLimit({ 
  points: 10,        // 10 requisições
  duration: 60,      // Por minuto
  blockDuration: 300 // Bloqueio por 5 minutos
})
async scheduleAppointment() {
  // Endpoint protegido
}
```

**Algoritmos:**
- **Sliding Window**: Controle preciso de taxa de requisições
- **Token Bucket**: Permite rajadas controladas
- **Memory + Redis**: Fallback para alta disponibilidade

### 3. **Security Middleware**
Headers de segurança baseados no Helmet.js:

```typescript
// Headers aplicados automaticamente
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

**Detecção de Ataques:**
- SQL Injection patterns
- XSS attempts  
- Path traversal
- Vulnerability scanners
- Suspicious user agents

---

## ⚙️ **Configuração e Uso**

### Endpoints Protegidos

```typescript
// Appointment scheduling - Rate limit restritivo
@RateLimit({ points: 10, duration: 60, blockDuration: 300 })
POST /appointments

// Batch operations - Limite ainda mais restrito  
@RateLimit({ points: 5, duration: 300, blockDuration: 600 })
POST /appointments/batch

// Security management - Acesso limitado
@RateLimit({ points: 2, duration: 300 })
POST /security/whitelist
```

### Configuração Ambiente

```bash
# .env
NODE_ENV=production                    # Ativa proteção DDoS
DDOS_MAX_REQUESTS=100                 # Requests por minuto
DDOS_SUSPICIOUS_THRESHOLD=200         # Limite suspeito
DDOS_ATTACK_THRESHOLD=500             # Limite de ataque
ALLOWED_ORIGINS=https://app.domain.com # CORS
REDIS_URL=redis://localhost:6379      # Para rate limiting distribuído
```

### Middlewares Globais

```typescript
// main.ts - Ordem importante!
app.use(new SecurityMiddleware());      // 1. Headers de segurança
app.use(new DDoSProtectionMiddleware()); // 2. Proteção DDoS
app.useGlobalFilters(new GlobalExceptionFilter()); // 3. Error handling
```

---

## 🔍 **Detecção de Ameaças**

### Padrões Detectados Automaticamente

#### 1. **SQL Injection**
```sql
-- Padrões detectados
' OR '1'='1
UNION SELECT
DROP TABLE
INSERT INTO
DELETE FROM
-- comentários
/* comentários */
```

#### 2. **XSS (Cross-Site Scripting)**
```javascript
// Padrões detectados
<script>
javascript:
onerror=
onload=
eval(
document.cookie
```

#### 3. **Path Traversal**
```bash
# Padrões detectados
../
..\\
/etc/passwd
/etc/shadow
windows/system32
```

#### 4. **Vulnerability Scanners**
```bash
# User agents detectados
nikto, sqlmap, nessus, burp
acunetix, nmap, masscan
curl, wget, python-requests
```

#### 5. **Sensitive Files**
```bash
# Paths monitorados
/.env, /.git, /config
/admin, /wp-admin, /phpmyadmin  
/backup, /.htaccess, /web.config
```

### Resposta Automática

```typescript
// Escalação automática baseada na gravidade
if (requests > warningThreshold) {
  // Log warning + headers adicionais
}

if (requests > suspiciousThreshold) {  
  // Block temporário + alert
}

if (requests > attackThreshold) {
  // Block longo + alert crítico
}
```

---

## 🎛️ **Gerenciamento de Segurança**

### API de Controle

#### Status de Segurança
```bash
GET /security/status
```
```json
{
  "status": "active",
  "protections": {
    "rateLimit": true,
    "ddosProtection": true, 
    "securityHeaders": true,
    "idempotency": true
  },
  "statistics": {
    "suspiciousIPs": 5,
    "attackingIPs": 2,
    "warningIPs": 10,
    "totalBlocked": 7
  }
}
```

#### Gerenciamento de IPs
```bash
# Adicionar à whitelist
POST /security/whitelist
{
  "ip": "192.168.1.100",
  "reason": "Internal monitoring system"
}

# Adicionar à blacklist  
POST /security/blacklist
{
  "ip": "10.0.0.50",
  "reason": "Confirmed attacker"
}

# Limpar restrições
POST /security/clear-ip
{
  "ip": "203.0.113.10"
}
```

#### Health Check
```bash
GET /security/health
```
```json
{
  "status": "healthy",
  "components": {
    "rateLimiting": "operational",
    "ddosProtection": "operational", 
    "securityHeaders": "operational",
    "idempotency": "operational"
  }
}
```

---

## 📊 **Monitoramento e Alertas**

### Headers de Resposta

```bash
# Rate Limiting Info
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7  
X-RateLimit-Reset: 45
Retry-After: 45

# Security Status
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Request-ID: abc123xyz
X-API-Version: 1.0

# Attack Detection
X-Suspicious-Activity: true      # Atividade suspeita
X-Attack-Detected: true          # Ataque confirmado
```

### Logs Estruturados

```json
{
  "level": "warn",
  "timestamp": "2024-01-15T10:30:00Z",
  "message": "DDoS attack pattern detected",
  "context": {
    "ip": "203.0.113.5",
    "endpoint": "/appointments",
    "userAgent": "curl/7.68.0",
    "requestCount": 500,
    "blockDuration": 3600000,
    "severity": "HIGH"
  }
}
```

### Métricas de Monitoramento

```typescript
// Métricas disponíveis via /security/status
{
  requests_per_minute: 150,
  blocked_requests: 25,
  suspicious_ips: 5,
  attacking_ips: 2,
  average_response_time: 120,
  security_incidents: 3
}
```

---

## ⚡ **Performance e Otimização**

### Configurações de Performance

```typescript
// Rate limiter otimizado
const rateLimiter = new RateLimiterMemory({
  points: 100,              // Requests
  duration: 60,             // Janela em segundos
  blockDuration: 300,       // Bloqueio em segundos
  keyPrefix: 'api-limit',   // Prefixo para organização
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Cleanup automático
setInterval(() => {
  rateLimiter.clearExpired();
}, 1000 * 3600); // A cada hora
```

### Memory Usage Otimizado

```typescript
// Limits de memória para tracking
const MAX_TRACKED_IPS = 10000;
const MAX_LOG_ENTRIES = 1000;
const CLEANUP_INTERVAL = 3600000; // 1 hora

// Automatic cleanup baseado em TTL
if (trackingMap.size > MAX_TRACKED_IPS) {
  cleanupOldestEntries(trackingMap);
}
```

---

## 🛠️ **Configuração Avançada**

### Nginx Frontend (Recomendado)

```nginx
# nginx.conf - Proteção adicional
http {
    # Rate limiting por IP
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # Connection limiting  
    limit_conn_zone $binary_remote_addr zone=connlimit:10m;
    
    server {
        # DDoS protection
        limit_req zone=api burst=20 nodelay;
        limit_conn connlimit 10;
        
        # Security headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Hide server info
        server_tokens off;
        
        # Proxy to Node.js
        location / {
            proxy_pass http://localhost:3000;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

### CloudFlare Integration

```javascript
// CloudFlare Worker para proteção extra
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Verificar IP reputation
  const ip = request.headers.get('CF-Connecting-IP');
  const threat = request.cf.threatScore;
  
  if (threat > 30) {
    return new Response('Access denied', { status: 403 });
  }
  
  // Rate limiting por país
  const country = request.cf.country;
  if (country === 'XX') { // Países suspeitos
    return new Response('Geo blocked', { status: 403 });
  }
  
  return fetch(request);
}
```

### Redis Cluster Setup

```typescript
// Redis cluster para alta disponibilidade
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const cluster = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 },
]);

const rateLimiter = new RateLimiterRedis({
  storeClient: cluster,
  keyPrefix: 'api-rl',
  points: 100,
  duration: 60,
});
```

---

## 🚨 **Resposta a Incidentes**

### Detecção de Ataques

```bash
# 1. Verificar logs em tempo real
tail -f /var/log/app/security.log | grep "attack"

# 2. Verificar métricas via API
curl http://localhost:3000/security/status

# 3. Verificar IPs atacantes
curl http://localhost:3000/security/status | jq '.statistics'
```

### Resposta Automática

```typescript
// Automated response baseado na severidade
const alertAttack = (ip: string, severity: string) => {
  if (severity === 'HIGH') {
    // 1. Block IP imediatamente
    addToBlacklist(ip);
    
    // 2. Alert Slack/Discord
    sendSlackAlert(`🚨 DDoS attack from ${ip}`);
    
    // 3. Update firewall rules
    updateFirewallRules(ip, 'DENY');
    
    // 4. Log to SIEM
    logToSIEM({ event: 'ddos_attack', ip, severity });
  }
};
```

### Manual Response

```bash
# Bloquear IP manualmente
curl -X POST http://localhost:3000/security/blacklist \
  -H "Content-Type: application/json" \
  -d '{"ip":"192.0.2.1","reason":"Manual block during incident"}'

# Limpar todas as restrições após incidente
curl -X POST http://localhost:3000/security/clear-ip \
  -H "Content-Type: application/json" \
  -d '{"ip":"192.0.2.1"}'

# Verificar saúde do sistema
curl http://localhost:3000/security/health
```

---

## 📈 **Análise e Relatórios**

### Dashboard Metrics

```json
{
  "security_overview": {
    "total_requests": 15000,
    "blocked_requests": 450, 
    "block_rate": "3%",
    "top_blocked_countries": ["XX", "YY", "ZZ"],
    "attack_types": {
      "ddos": 12,
      "sql_injection": 5,
      "xss": 3,
      "scanner": 8
    }
  },
  "performance_impact": {
    "avg_response_time": "125ms",
    "security_overhead": "15ms",
    "memory_usage": "45MB",
    "false_positive_rate": "0.1%"
  }
}
```

### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: security_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"4.."}[5m]) > 0.1
        for: 5m
        
      - alert: DDoSAttack
        expr: rate(http_requests_total[1m]) > 500
        for: 30s
        
      - alert: SuspiciousActivity
        expr: security_suspicious_ips > 10
        for: 2m
```

---

## 🔧 **Troubleshooting**

### Problemas Comuns

#### 1. **False Positives**
```bash
# Sintoma: Usuários legítimos bloqueados
# Solução: Ajustar thresholds
DDOS_MAX_REQUESTS=150  # Aumentar limite
DDOS_SUSPICIOUS_THRESHOLD=300

# Ou adicionar à whitelist
curl -X POST /security/whitelist -d '{"ip":"user-ip"}'
```

#### 2. **Performance Issues**
```bash
# Sintoma: Latência alta
# Solução: Otimizar rate limiter
points: 200,           # Aumentar limite
duration: 60,          # Manter janela
blockDuration: 60,     # Reduzir bloqueio
```

#### 3. **Memory Usage**
```bash
# Sintoma: Alto uso de memória
# Solução: Configurar cleanup
const cleanup = setInterval(() => {
  rateLimiter.clearExpired();
}, 300000); // 5 minutos
```

### Debug Mode

```bash
# Ativar logs detalhados
NODE_ENV=development
DEBUG=security:*
LOG_LEVEL=debug

# Desativar proteção em desenvolvimento  
DDOS_ENABLED=false
SECURITY_STRICT=false
```

---

## 🎯 **Melhores Práticas**

### Configuração Production

1. **Sempre usar HTTPS**
2. **Configurar Nginx/CloudFlare como proxy**
3. **Usar Redis cluster para rate limiting**
4. **Monitorar métricas continuamente**
5. **Configurar alertas automáticos**
6. **Fazer backup de whitelists/blacklists**
7. **Testar incident response regularmente**

### Security Checklist

- ✅ DDoS protection ativada
- ✅ Rate limiting configurado por endpoint
- ✅ Headers de segurança aplicados
- ✅ Logs de segurança monitorados
- ✅ IPs suspeitos rastreados
- ✅ Alertas configurados
- ✅ Backup e recovery testados
- ✅ Documentation atualizada

---

**🛡️ Com essa implementação, sua API está protegida contra os principais vetores de ataque e pronta para ambientes de produção enterprise! 🚀**