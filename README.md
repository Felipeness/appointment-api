# 🏥 Appointment API - Enterprise Healthcare System

> **Enterprise-grade appointment scheduling system built with Clean Architecture, Domain-Driven Design, and event-driven microservices patterns.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11+-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![AWS SQS](https://img.shields.io/badge/AWS-SQS-orange.svg)](https://aws.amazon.com/sqs/)
[![Redis](https://img.shields.io/badge/Redis-7+-red.svg)](https://redis.io/)

## 🚀 **Key Features**

- **🔄 Asynchronous Processing**: Event-driven architecture with AWS SQS
- **🏗️ Clean Architecture**: Hexagonal architecture with DDD principles
- **🛡️ Enterprise Security**: DDoS protection, rate limiting, and input validation
- **📈 High Scalability**: Horizontal scaling with message queues
- **🔒 Data Consistency**: Saga pattern for distributed transactions
- **⚡ High Performance**: Circuit breaker, retry mechanisms, and caching
- **🔍 Observability**: Structured logging with correlation IDs
- **🚨 Resilience**: Dead Letter Queue and compensation patterns

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
- **[Helmet.js](https://helmetjs.github.io/)** - Security headers
- **Rate Limiting** - Request throttling with sliding window
- **Circuit Breaker** - Failure isolation pattern
- **DDoS Protection** - Progressive attack mitigation

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

### **Clean Architecture Structure**

```
src/
├── domain/              # 🏛️ Business Logic & Rules (DDD)
│   ├── entities/        # Domain entities
│   ├── repositories/    # Repository interfaces
│   └── value-objects/   # Value objects
├── application/         # 🎯 Use Cases & Application Services
│   ├── use-cases/       # Business use cases
│   ├── dtos/           # Data transfer objects
│   └── interfaces/      # Application contracts
├── infrastructure/      # 🔧 External Implementations
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

```bash
# Clone o repositório
git clone <repository-url>
cd appointment-api

# Inicie todos os serviços
docker-compose up -d

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

### Clean Architecture
- **Domain Layer**: Regras de negócio puras
- **Application Layer**: Casos de uso
- **Infrastructure Layer**: Detalhes técnicos
- **Presentation Layer**: Controllers e DTOs

### Design Patterns
- **Repository Pattern**: Abstração do acesso a dados
- **Factory Pattern**: Criação de objetos complexos
- **Observer Pattern**: Notificações assíncronas

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

Desenvolvido como parte do desafio técnico para vaga de desenvolvedor backend.