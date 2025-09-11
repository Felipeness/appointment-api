# 🧪 Guia de Testes - Appointment API

Este guia fornece informações detalhadas sobre a estratégia de testes, configuração e melhores práticas para o projeto Appointment API.

## 📋 **Visão Geral**

O projeto implementa uma estratégia abrangente de testes seguindo a **Pirâmide de Testes**, com foco em qualidade, performance e confiabilidade.

### Tipos de Teste Implementados:
- ✅ **Testes Unitários** (Unit Tests)
- ✅ **Testes de Integração** (Integration Tests)  
- ✅ **Testes End-to-End** (E2E Tests)
- ✅ **Testes de Performance** (Performance Tests)
- ✅ **Coverage Reporting**

---

## 🚀 **Executando os Testes**

### Comandos Básicos

```bash
# Todos os testes
bun run test

# Por tipo específico
bun run test:unit           # Testes unitários
bun run test:integration    # Testes de integração
bun run test:e2e           # Testes E2E
bun run test:performance   # Testes de performance

# Com coverage
bun run test:cov           # Coverage completo
bun run test:cov:ci        # Coverage para CI

# Watch mode
bun run test:watch         # Observar mudanças

# Script unificado
./scripts/run-tests.sh all --coverage
./scripts/run-tests.sh unit --watch
./scripts/run-tests.sh performance --verbose
```

### Script de Teste Avançado

```bash
# Executar todos os testes com coverage
./scripts/run-tests.sh all --coverage

# Executar em modo CI
./scripts/run-tests.sh all --coverage --ci

# Executar tipo específico com opções
./scripts/run-tests.sh performance --verbose
./scripts/run-tests.sh unit --watch --coverage
```

---

## 📊 **Coverage Reporting**

### Configuração

O projeto está configurado com thresholds rigorosos de coverage:

```json
{
  "global": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  },
  "domain": {
    "branches": 95,
    "functions": 95,
    "lines": 95,
    "statements": 95
  },
  "application": {
    "branches": 85,
    "functions": 85,
    "lines": 85,
    "statements": 85
  }
}
```

### Relatórios Gerados

- **Text**: Output no terminal
- **LCOV**: Para integração com ferramentas
- **HTML**: Relatório visual em `coverage/lcov-report/index.html`

---

## 🏗️ **Estrutura de Testes**

### Organização de Arquivos

```
test/
├── setup.ts                           # Setup global do Jest
├── jest-e2e.json                      # Configuração E2E
├── app.e2e-spec.ts                    # Testes E2E da aplicação
└── performance/                       # Testes de performance
    ├── sqs-producer.performance.spec.ts
    └── api-endpoints.performance.spec.ts

src/
├── domain/entities/__tests__/          # Testes unitários de entidades
├── domain/value-objects/__tests__/     # Testes unitários de VOs
├── application/dtos/__tests__/         # Testes unitários de DTOs
├── application/use-cases/__tests__/    # Testes de integração
└── common/                            # Testes de infraestrutura
    ├── exceptions/__tests__/
    └── filters/__tests__/
```

### Convenções de Nomenclatura

- **Unit Tests**: `.spec.ts` no diretório `__tests__` ao lado do código
- **Integration Tests**: `.spec.ts` com mocks de dependências
- **E2E Tests**: `.e2e-spec.ts` no diretório `test/`
- **Performance Tests**: `.performance.spec.ts` no diretório `test/performance/`

---

## 🎯 **Tipos de Teste Detalhados**

### 1. Testes Unitários

**Objetivo**: Testar componentes isolados sem dependências externas.

```typescript
// Exemplo: Teste de entidade de domínio
describe('Appointment Entity', () => {
  it('should create valid appointment', () => {
    const appointment = new Appointment({
      patientId: 'patient-123',
      psychologistId: 'psych-123',
      startDateTime: new Date('2024-02-01T10:00:00Z'),
      duration: 60,
      type: 'consultation'
    });

    expect(appointment).toBeDefined();
    expect(appointment.patientId).toBe('patient-123');
  });
});
```

**Características**:
- Sem mocks de dependências externas
- Execução rápida (< 1ms por teste)
- Foco em lógica de negócio pura
- Alta coverage (95% para domain layer)

### 2. Testes de Integração

**Objetivo**: Testar interação entre componentes com mocks controlados.

```typescript
// Exemplo: Teste de use case
describe('ScheduleAppointmentUseCase', () => {
  beforeEach(() => {
    mockRepository = {
      findByTimeSlot: jest.fn(),
      save: jest.fn(),
    };
  });

  it('should schedule appointment successfully', async () => {
    // Arrange
    mockRepository.findByTimeSlot.mockResolvedValue([]);
    
    // Act
    const result = await useCase.execute(createAppointmentDto);
    
    // Assert
    expect(result.success).toBe(true);
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

**Características**:
- Mocks de repositories e serviços externos
- Testa fluxo completo de use cases
- Validação de interações entre camadas
- Coverage de 85% para application layer

### 3. Testes End-to-End

**Objetivo**: Testar sistema completo através da interface HTTP.

```typescript
// Exemplo: Teste E2E
describe('POST /appointments', () => {
  it('should create appointment via HTTP', async () => {
    const appointmentDto = {
      patientId: 'patient-123',
      psychologistId: 'psych-123',
      startDateTime: '2024-12-25T10:00:00Z',
      duration: 60,
      type: 'consultation'
    };

    const response = await request(app.getHttpServer())
      .post('/appointments')
      .send(appointmentDto)
      .expect(202);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('requestId');
  });
});
```

**Características**:
- Setup completo da aplicação NestJS
- Testa endpoints HTTP reais
- Validação de contratos de API
- Integração com SuperTest

### 4. Testes de Performance

**Objetivo**: Validar performance e escalabilidade do sistema.

```typescript
// Exemplo: Teste de performance
describe('SQS Producer Performance', () => {
  it('should send message within acceptable time', async () => {
    const startTime = performance.now();
    
    await producer.sendMessage(message);
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(100); // < 100ms
  });

  it('should handle 100 concurrent messages', async () => {
    const promises = messages.map(msg => producer.sendMessage(msg));
    
    const startTime = performance.now();
    await Promise.all(promises);
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(5000); // < 5s total
  });
});
```

**Métricas Monitoradas**:
- Response time individual (< 100ms para SQS)
- Throughput (> 20 msg/s)
- Concurrent load (10+ requests simultâneas)
- Memory usage (sem vazamentos)
- P95 response time (< 300ms)

---

## ⚙️ **Configuração do Ambiente**

### Variáveis de Ambiente

```bash
# Arquivo .env.test
NODE_ENV=test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appointment_test"
REDIS_URL="redis://localhost:6379"
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
SQS_QUEUE_URL="http://localhost:9324/queue/test-queue"
```

### Setup de Banco de Dados

```bash
# Executar migrações para testes
bun run db:migrate

# Gerar client do Prisma
bun run db:generate

# Executar seeds (se necessário)
bun run db:seed
```

### Dependências de Teste

```bash
# Instalar dependências
bun install

# Dependências específicas de teste já incluídas:
# - Jest, ts-jest, @types/jest
# - SuperTest para E2E
# - @nestjs/testing para mocks
```

---

## 🔧 **CI/CD Integration**

### GitHub Actions Pipeline

O projeto inclui um pipeline completo de CI/CD com:

1. **Test Stage**:
   - Setup de PostgreSQL e Redis
   - Execução de todos os tipos de teste
   - Geração de coverage report
   - Upload para Codecov

2. **Build Stage**:
   - Compilação da aplicação
   - Armazenamento de artifacts

3. **Security Stage**:
   - Security audit com Bun
   - Análise de código com CodeQL

### Configuração Local

```bash
# Simular pipeline localmente
./scripts/run-tests.sh all --coverage --ci

# Executar apenas testes (como no CI)
bun run test:ci
```

---

## 🚨 **Troubleshooting**

### Problemas Comuns

1. **Testes falhando por timeout**:
   ```bash
   # Aumentar timeout no Jest
   jest.setTimeout(30000);
   ```

2. **Problemas de memória**:
   ```bash
   # Executar com mais memória
   NODE_OPTIONS="--max-old-space-size=4096" bun run test
   ```

3. **Banco de dados não conectando**:
   ```bash
   # Verificar se PostgreSQL está rodando
   pg_isready -h localhost -p 5432
   ```

4. **Redis não disponível**:
   ```bash
   # Verificar Redis
   redis-cli ping
   ```

### Debug de Testes

```bash
# Executar com debug
bun run test:debug

# Executar teste específico
bun run test -- --testNamePattern="should create appointment"

# Executar com logs verbosos
bun run test -- --verbose
```

---

## 📈 **Métricas e Monitoring**

### Coverage Targets

- **Global**: 80% minimum
- **Domain Layer**: 95% (business critical)
- **Application Layer**: 85% (use cases)
- **Infrastructure**: 80% (adapters)

### Performance Benchmarks

- **API Response**: < 200ms (P95)
- **SQS Messages**: < 100ms per message
- **Database Queries**: < 50ms
- **Memory Usage**: < 512MB for test suite

### Quality Gates

Todos os testes devem:
- ✅ Passar em 100% dos casos
- ✅ Atender thresholds de coverage
- ✅ Não exceder limites de performance
- ✅ Não apresentar vazamentos de memória

---

## 🎯 **Boas Práticas**

### Estrutura de Testes

1. **Arrange-Act-Assert (AAA)**:
   ```typescript
   it('should do something', () => {
     // Arrange
     const input = createTestData();
     
     // Act
     const result = systemUnderTest.execute(input);
     
     // Assert
     expect(result).toBe(expectedOutput);
   });
   ```

2. **Descriptive Test Names**:
   ```typescript
   // ✅ Bom
   it('should throw error when appointment time conflicts with existing booking')
   
   // ❌ Ruim
   it('should throw error')
   ```

3. **Test Data Builders**:
   ```typescript
   const createValidAppointment = (overrides = {}) => ({
     patientId: 'patient-123',
     psychologistId: 'psych-123',
     startDateTime: new Date('2024-02-01T10:00:00Z'),
     duration: 60,
     type: 'consultation',
     ...overrides
   });
   ```

### Mocking Guidelines

1. **Mock Externo, Teste Interno**:
   - Mock apenas dependências externas
   - Teste lógica interna sem mocks

2. **Verify Interactions**:
   ```typescript
   expect(mockRepository.save).toHaveBeenCalledWith(
     expect.objectContaining({
       patientId: 'patient-123'
     })
   );
   ```

3. **Reset Mocks**:
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

### Performance Testing

1. **Measure What Matters**:
   - Response time
   - Throughput
   - Resource usage
   - Error rates

2. **Set Realistic Expectations**:
   ```typescript
   // ✅ Específico e realista
   expect(duration).toBeLessThan(100);
   
   // ❌ Muito genérico
   expect(duration).toBeLessThan(10000);
   ```

3. **Test Under Load**:
   ```typescript
   // Testar com cargas realistas
   const concurrentRequests = 50;
   const promises = Array.from({length: concurrentRequests}, ...);
   ```

---

## 📚 **Recursos Adicionais**

### Documentação

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [SuperTest](https://github.com/ladjs/supertest)
- [Testing Library](https://testing-library.com/)

### Ferramentas

- **Coverage Viewer**: `coverage/lcov-report/index.html`
- **Test Runner**: `./scripts/run-tests.sh --help`
- **CI Pipeline**: `.github/workflows/ci.yml`

### Scripts Úteis

```bash
# Gerar relatório de coverage HTML
bun run test:cov && open coverage/lcov-report/index.html

# Executar testes específicos do domínio
bun run test -- src/domain

# Performance benchmark
./scripts/run-tests.sh performance --verbose

# CI simulation
./scripts/run-tests.sh all --coverage --ci
```

---

**✨ Happy Testing! 🎉**