# 🏥 Appointment API - Enterprise Healthcare System

> **Enterprise-grade appointment scheduling system built with Clean Architecture, Domain-Driven Design, and event-driven microservices patterns.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11+-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![AWS SQS](https://img.shields.io/badge/AWS-SQS-orange.svg)](https://aws.amazon.com/sqs/)
[![Redis](https://img.shields.io/badge/Redis-7+-red.svg)](https://redis.io/)

## 🚀 **Key Features**

- **🔄 Asynchronous Processing**: SQS with exponential backoff, idempotency keys, and DLQ redrive policies
- **🧱 Architecture**: Clean Architecture with DDD modeling (Bounded Contexts, Aggregates, Domain Entities)
- **🛡️ Enterprise Security**: Rate limiting, input validation (class-validator), secrets management, and IAM least privilege
- **📈 Scalability**: Auto scaling with backpressure control (batch size, concurrency, visibility timeout)
- **🔒 Data Consistency**: Transactional Outbox pattern with Saga orchestration when needed
- **⚡ Performance**: Circuit breaker for sync calls, timeouts with jitter, Redis caching
- **🔍 Observability**: Structured logs + correlation IDs, RED/USE metrics, distributed tracing (OpenTelemetry)
- **🚨 Resilience**: DLQ with poison-pill detection, health checks, and graceful fallbacks

## 🛠️ **Technology Stack**

### **Backend Framework**
- **[Bun Runtime](https://bun.sh/)** - Ultra-fast JavaScript runtime
- **[NestJS 11+](https://nestjs.com/)** - Progressive Node.js framework
- **[TypeScript 5.7+](https://www.typescriptlang.org/)** - Type-safe development

### **Database & Storage**
- **[PostgreSQL 15](https://postgresql.org/)** - Primary database with ACID compliance
- **[Prisma ORM](https://prisma.io/)** - Type-safe database access
- **[Redis 7](https://redis.io/)** - Caching and idempotency store

### **Message Queue & Events**
- **[AWS SQS](https://aws.amazon.com/sqs/)** - Reliable message queuing
- **Event-Driven Architecture** - Asynchronous processing
- **Saga Pattern** - Distributed transaction management

### **Security & Resilience**
- **[Helmet.js](https://helmetjs.github.io/)** - Security headers and CORS
- **[Class Validator](https://github.com/typestack/class-validator)** - Input validation with DTO sanitization
- **Rate Limiting** - Token bucket algorithm with @nestjs/throttler
- **Circuit Breaker** - Failure isolation for synchronous calls (HTTP/gRPC)
- **Idempotency Keys** - Request deduplication with Redis store
- **Secrets Management** - AWS Secrets Manager integration

---

## 🏗️ **System Architecture**

```mermaid
graph TB
    Client[Client Application] --> Gateway[API Gateway]
    Gateway --> Controller[Appointments Controller]
    
    Controller --> UseCase[Enterprise Schedule UseCase]
    UseCase --> Validator[Business Validation]
    UseCase --> Producer[SQS Producer]
    
    Producer --> SQS[AWS SQS Queue]
    SQS --> Consumer[Enterprise Consumer]
    
    Consumer --> Saga[Saga Orchestrator]
    Saga --> Step1[Validate Patient]
    Saga --> Step2[Check Availability]
    Saga --> Step3[Create Appointment]
    
    Step1 --> DB[(PostgreSQL)]
    Step2 --> DB
    Step3 --> DB
    
    Consumer --> DLQ[Dead Letter Queue]
    DLQ --> Retry[Retry Handler]
    
    subgraph Security Layer
        DDoS[DDoS Protection]
        RateLimit[Rate Limiting]
        IdempotencyCache[Redis Cache]
    end
    
    Gateway --> Security
```

### **Clean Architecture with Domain-Driven Design**

```
src/
├── domain/              # 🏛️ Business Core (DDD Bounded Context)
│   ├── entities/        # Aggregates and domain entities  
│   ├── repositories/    # Repository ports (interfaces)
│   └── value-objects/   # Domain value objects and rules
├── application/         # 🎯 Application Layer (Use Cases)
│   ├── use-cases/       # Application services and orchestration
│   ├── dtos/           # Data transfer objects (input/output)
│   └── interfaces/      # Application ports (contracts)
├── infrastructure/      # 🔧 Adapters (External Concerns)
│   ├── database/        # Prisma & repositories
│   ├── messaging/       # SQS & event handling
│   ├── config/         # Configuration
│   └── security/        # Security implementations
├── presentation/        # 📡 Controllers & API Layer
│   ├── controllers/     # REST controllers
│   ├── middlewares/     # HTTP middlewares
│   └── guards/         # Authorization guards
└── common/             # 🛠️ Shared Utilities
    ├── decorators/      # Custom decorators
    ├── filters/        # Exception filters
    ├── interceptors/   # Request/response interceptors
    ├── resilience/     # Circuit breaker, retry logic
    └── saga/           # Saga orchestration
```

## 🚀 Fluxo da Aplicação

1. **POST /appointments** - Recebe solicitação de agendamento
2. **Validação inicial** - Verifica regras básicas (24h, disponibilidade)
3. **Envia para SQS** - Publica mensagem na fila
4. **Consumer processa** - Valida disponibilidade e confirma/rejeita
5. **Notificação** - Informa resultado ao paciente

### 📋 Regras de Negócio

- ✅ Agendamentos devem ser feitos com pelo menos 24h de antecedência
- ✅ Respeita horários de trabalho do psicólogo
- ✅ Impede conflitos de horário (mesmo psicólogo, mesmo horário)
- ✅ Retry automático para falhas de processamento
- ✅ Logs abrangentes para auditoria

## 🚀 Executando o Projeto

### Pré-requisitos

- [Bun](https://bun.sh/docs/installation) >= 1.0
- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- PostgreSQL (ou usar via Docker)
- AWS SQS (ou LocalStack para desenvolvimento)

### 🐳 Via Docker (Recomendado)

#### 🚀 Início Rápido com Scripts Automatizados

```bash
# Clone o repositório
git clone <repository-url>
cd appointment-api

# 1. Inicie todo o sistema (Docker + Infraestrutura)
chmod +x start-system.sh
./start-system.sh

# 2. Execute os testes automatizados (após o sistema iniciar)
chmod +x test-api.sh
./test-api.sh
```

#### 🎯 Scripts de Demonstração Enterprise

Para demonstrações técnicas e apresentações:

```bash
# Script de demonstração interativa (28 etapas)
# Mostra Clean Architecture, DDD, EDA, CQRS, Saga Pattern
chmod +x demo-presentation.sh
./demo-presentation.sh

# Monitor em tempo real (execute em terminal separado)
# 7 modos: API logs, performance, eventos EDA
chmod +x monitor-demo.sh
./monitor-demo.sh
```

**Scripts disponíveis:**
- 📋 `demo-commands.md` - Comandos organizados por seção arquitetural
- 🎬 `demo-presentation.sh` - Demonstração interativa completa (259 linhas)
- 🔍 `monitor-demo.sh` - Monitor de sistema em tempo real (136 linhas)
- 📖 `README-PRESENTATION.md` - Guia completo de apresentação

O script `start-system.sh` irá:
- 🛑 Parar containers existentes
- 🧹 Limpar volumes órfãos
- 🏗️ Construir e iniciar PostgreSQL, Redis, LocalStack (AWS SQS)
- 🚀 Iniciar a aplicação NestJS
- 📊 Executar migrações e seeds automaticamente
- ✅ Verificar se todos os serviços estão funcionando

O script `test-api.sh` irá:
- 🔍 Verificar se a API está disponível
- 👩‍⚕️ Configurar psicólogos no banco de dados
- 🧪 Executar 16 testes abrangentes (POST, GET, validações)
- 📋 Exibir logs e estatísticas do sistema
- 💎 Mostrar tabela bonita com consultas agendadas

#### 🐳 Método Manual (Docker)

```bash
# Inicie todos os serviços
docker-compose -f docker-compose.complete.yml up --build

# Execute as migrações
docker-compose exec app bun db:migrate

# Execute o seed (dados de exemplo)
docker-compose exec app bun db:seed
```

### 💻 Desenvolvimento Local

```bash
# Instale as dependências
bun install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# Execute as migrações do banco
bun db:migrate

# Execute os seeds (dados de exemplo)
bun db:seed

# Inicie em modo de desenvolvimento
bun run start:dev
```

### 📊 Acessando a Aplicação

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api
- **Prisma Studio**: `bun db:studio`

## 🧪 Testes

```bash
# Testes unitários
bun test

# Testes com coverage
bun test:cov

# Testes em modo watch
bun test:watch

# Testes e2e
bun test:e2e
```

## 📡 Endpoints da API

### GET /appointments

Lista consultas com filtros e paginação.

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (máx 100, padrão: 20)
- `patientId` (opcional): Filtrar por ID do paciente
- `psychologistId` (opcional): Filtrar por ID do psicólogo
- `status` (opcional): Filtrar por status (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- `appointmentType` (opcional): Filtrar por tipo (CONSULTATION, THERAPY_SESSION, EMERGENCY, FOLLOW_UP)
- `startDate` (opcional): Data inicial (ISO format)
- `endDate` (opcional): Data final (ISO format)
- `sortBy` (opcional): Campo para ordenação (scheduledAt, createdAt, updatedAt, status)
- `sortOrder` (opcional): Ordem (asc, desc)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "clx123456789",
      "patientId": "clx987654321",
      "psychologistId": "clx456789123",
      "scheduledAt": "2025-01-15T10:00:00.000Z",
      "duration": 60,
      "appointmentType": "CONSULTATION",
      "status": "CONFIRMED",
      "meetingType": "VIDEO_CALL",
      "meetingUrl": "https://meet.google.com/abc-def-ghi",
      "reason": "Initial consultation",
      "consultationFee": 150.0,
      "isPaid": false,
      "createdAt": "2025-01-10T14:30:00.000Z",
      "updatedAt": "2025-01-10T14:30:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

### POST /appointments

Cria uma nova solicitação de agendamento.

**Request Body:**
```json
{
  "patientEmail": "patient@example.com",
  "patientName": "John Doe",
  "patientPhone": "+55 11 99999-9999",
  "psychologistId": "clx123456789",
  "scheduledAt": "2024-12-25T10:00:00Z",
  "notes": "First consultation"
}
```

**Response (202 Accepted):**
```json
{
  "appointmentId": "clx987654321",
  "status": "queued",
  "message": "Appointment request has been queued for processing"
}
```

### POST /appointments/batch

Cria múltiplas solicitações de agendamento em lote.

**Request Body:**
```json
{
  "appointments": [
    {
      "patientEmail": "patient1@example.com",
      "patientName": "John Doe",
      "psychologistId": "clx123456789",
      "scheduledAt": "2024-12-25T10:00:00Z"
    },
    {
      "patientEmail": "patient2@example.com",
      "patientName": "Jane Smith",
      "psychologistId": "clx123456789",
      "scheduledAt": "2024-12-26T10:00:00Z"
    }
  ]
}
```

**Response (202 Accepted):**
```json
{
  "batchId": "batch_1234567890_abc123",
  "totalRequests": 2,
  "successful": 1,
  "failed": 1,
  "results": [
    {
      "appointmentId": "clx987654321",
      "status": "queued",
      "traceId": "trace_123"
    },
    {
      "appointmentId": "clx876543210",
      "status": "failed",
      "traceId": "trace_124"
    }
  ],
  "message": "Batch processed: 1 queued, 1 failed"
}
```

## ⚙️ Configuração de Ambiente

### Variáveis de Ambiente (.env)

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/appointment_db"

# AWS SQS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SQS_APPOINTMENT_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/account/queue

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NODE_ENV=development
PORT=3000
```

## 📚 Scripts Disponíveis

```bash
# Desenvolvimento
bun run start:dev      # Inicia em modo watch
bun run start:debug    # Inicia com debug

# Produção
bun run build         # Compila o projeto
bun run start:prod    # Inicia em produção

# Banco de dados
bun db:migrate        # Executa migrações
bun db:seed          # Popula dados de exemplo
bun db:studio        # Abre Prisma Studio
bun db:generate      # Gera cliente Prisma

# Qualidade de código
bun run lint         # Executa ESLint
bun run format       # Formata código com Prettier
```

## 🎯 Princípios Aplicados

### SOLID
- **SRP**: Cada classe tem responsabilidade única
- **OCP**: Extensível via interfaces
- **LSP**: Substituição de implementações
- **ISP**: Interfaces específicas por contexto  
- **DIP**: Injeção de dependência

### Clean Architecture Layers
- **Domain Layer**: Aggregates, entities, value objects e regras de negócio (DDD)
- **Application Layer**: Use cases, DTOs e interfaces (ports)
- **Infrastructure Layer**: Implementações concretas (adapters) para Prisma, SQS, HTTP
- **Presentation Layer**: Controllers, middlewares e validação de entrada

### Design Patterns
- **Repository Pattern**: Abstração do acesso a dados (Ports/Adapters)
- **Transactional Outbox**: Eventos e dados persistidos na mesma transação
- **Saga Pattern**: Orquestração de transações distribuídas quando necessário
- **Circuit Breaker**: Isolamento de falhas em chamadas síncronas

## 🔧 **Implementação Prática (NestJS/TypeScript)**

### **Correlation ID & Observability**
```typescript
// Middleware que injeta x-correlation-id e propaga para logs/SQS
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
  }
}
```

### **Idempotency com Redis**
```typescript
// Deduplicação de handlers SQS e requests HTTP
@Injectable()
export class IdempotencyService {
  async processWithIdempotency(key: string, handler: () => Promise<any>) {
    const existing = await this.redis.get(`idempotency:${key}`);
    if (existing) return JSON.parse(existing);
    
    const result = await handler();
    await this.redis.setex(`idempotency:${key}`, 3600, JSON.stringify(result));
    return result;
  }
}
```

### **SQS com Exponential Backoff**
```typescript
// maxReceiveCount na redrive + visibility timeout ajustado
consumers: [{
  name: 'appointment-consumer',
  queueUrl: process.env.SQS_QUEUE_URL,
  batchSize: 10,
  visibilityTimeoutSeconds: 300, // 5min para processamento
  maxReceiveCount: 3, // Após 3 tentativas → DLQ
}]
```

### **Transactional Outbox Pattern**
```typescript
// Persistir evento e dados na mesma transação
async createAppointment(data: CreateAppointmentDto) {
  return this.prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.create({ data });
    
    // Evento persistido na mesma transação
    await tx.outboxEvent.create({
      data: {
        eventType: 'APPOINTMENT_CREATED',
        aggregateId: appointment.id,
        payload: JSON.stringify(appointment)
      }
    });
    
    return appointment;
  });
}
```

## 🔧 Justificativa Técnica

### Por que SQS ao invés de RabbitMQ?
- **Managed Service**: Menos overhead operacional
- **Escalabilidade**: Auto-scaling nativo da AWS
- **Integração**: Melhor integração com ecossistema AWS
- **Confiabilidade**: SLA garantido pela AWS
- **Dead Letter Queue**: Tratamento de mensagens falhas

## 🐛 Troubleshooting

### Problemas Comuns

**Erro de conexão com banco:**
```bash
# Verifique se o PostgreSQL está rodando
docker-compose ps postgres

# Refaça as migrações
bun db:migrate
```

**SQS não funciona:**
```bash
# Para desenvolvimento local com LocalStack
docker-compose logs localstack

# Verifique se a fila foi criada
aws --endpoint-url=http://localhost:4566 sqs list-queues
```

## 📈 Monitoramento e Logs

A aplicação utiliza o sistema de logs do NestJS com diferentes níveis:
- **LOG**: Operações normais
- **WARN**: Situações de atenção
- **ERROR**: Erros que precisam investigação

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add: amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido por [Ness](https://github.com/Felipeness) para revisar e aplicar conceitos de Clean Architecture, SOLID, e Event-Driven Design.