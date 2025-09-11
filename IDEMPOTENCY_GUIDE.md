# 🔒 Guia de Idempotência - Appointment API

Este guia fornece informações detalhadas sobre a implementação de idempotência na Appointment API, baseado nas melhores práticas de empresas como Stripe, Netflix e AWS.

## 📋 **Visão Geral**

A idempotência garante que operações repetidas produzam o mesmo resultado, evitando duplicações, inconsistências de dados e efeitos colaterais indesejados. Nossa implementação cobre tanto APIs REST quanto processamento de mensagens SQS.

### Benefícios da Idempotência:
- ✅ **Segurança em Retries**: Operações podem ser repetidas sem efeitos colaterais
- ✅ **Prevenção de Duplicatas**: Evita criação de recursos duplicados
- ✅ **Recuperação de Falhas**: Permite recuperação segura de falhas de rede
- ✅ **Consistência**: Mantém integridade dos dados sob condições adversas
- ✅ **Auditoria**: Rastreamento completo de operações repetidas

---

## 🌐 **Idempotência em APIs REST**

### Implementação

Utilizamos **Idempotency Keys** conforme padrão da indústria:

```typescript
@Post()
@UseInterceptors(IdempotencyInterceptor)
@Idempotent({ ttl: 3600, scope: 'user', validateParameters: true })
async scheduleAppointment(
  @Body() dto: CreateAppointmentDto,
  @Headers('Idempotency-Key') idempotencyKey?: string
) {
  // Implementação automática via interceptor
}
```

### Headers HTTP

| Header | Descrição | Exemplo |
|--------|-----------|---------|
| `Idempotency-Key` | Chave única fornecida pelo cliente | `550e8400-e29b-41d4-a716-446655440000` |
| `X-Idempotency-Key` | Echo da chave processada | `550e8400-e29b-41d4-a716-446655440000` |
| `X-Idempotency-Cached` | Indica se resposta foi do cache | `true` ou `false` |

### Configuração de Idempotência

```typescript
@Idempotent({
  ttl: 3600,                    // TTL em segundos (1 hora)
  scope: 'user',                // Escopo: 'global', 'user', 'endpoint'
  validateParameters: true      // Validar parâmetros são idênticos
})
```

### Fluxo de Processamento

1. **Cliente envia requisição** com `Idempotency-Key`
2. **Interceptor verifica** se chave já existe
3. **Se existe**: Retorna resposta cacheada
4. **Se não existe**: Processa requisição e armazena resultado
5. **Cliente recebe** resposta com headers de idempotência

### Exemplo de Uso

```bash
# Primeira requisição
curl -X POST /appointments \
  -H "Idempotency-Key: uuid-12345" \
  -H "Content-Type: application/json" \
  -d '{"patientId": "p1", "psychologistId": "ps1", ...}'

# Response: 202 Accepted
# X-Idempotency-Key: uuid-12345
# X-Idempotency-Cached: false

# Requisição repetida (retry)
curl -X POST /appointments \
  -H "Idempotency-Key: uuid-12345" \
  -H "Content-Type: application/json" \
  -d '{"patientId": "p1", "psychologistId": "ps1", ...}'

# Response: 202 Accepted (mesma resposta)
# X-Idempotency-Key: uuid-12345
# X-Idempotency-Cached: true
```

---

## 📨 **Idempotência em SQS**

### Implementação

Para mensagens SQS, implementamos idempotência a nível de consumer:

```typescript
@SqsMessageHandler('appointment-consumer', false)
async handleAppointmentMessage(message: Message): Promise<void> {
  // 1. Verifica se mensagem já foi processada
  const isAlreadyProcessed = await this.sqsIdempotencyService.isProcessed(message);
  if (isAlreadyProcessed) {
    return; // Skip processamento
  }

  // 2. Valida conteúdo único
  const uniqueness = await this.sqsIdempotencyService.validateMessageUniqueness(message);
  if (!uniqueness.isUnique) {
    return; // Skip mensagem duplicada
  }

  try {
    // 3. Processa mensagem
    await this.processMessage(parsedMessage);
    
    // 4. Marca como processada com sucesso
    await this.sqsIdempotencyService.markAsProcessed(message, 'success', metadata);
  } catch (error) {
    // 5. Marca como falhada
    await this.sqsIdempotencyService.markAsProcessed(message, 'failure', errorData);
    throw error;
  }
}
```

### Estratégias de Deduplicação

#### 1. **Message ID Based** (Padrão)
- Usa `MessageId` do SQS como chave única
- Adequado para a maioria dos casos

#### 2. **Content Hash Based**
- Hash SHA-256 do conteúdo da mensagem
- Detecta duplicatas mesmo com IDs diferentes

#### 3. **FIFO Queue Integration**
- `MessageGroupId`: Agrupa mensagens logicamente
- `DeduplicationId`: Previne duplicatas na fila

```typescript
// Geração automática para filas FIFO
const deduplicationId = this.sqsIdempotencyService.generateDeduplicationId(
  messageBody,
  { patientId: 'p1', psychologistId: 'ps1' }
);

const messageGroupId = this.sqsIdempotencyService.generateMessageGroupId(messageBody);
// Result: "patient-p1" ou "psychologist-ps1"
```

### Métricas de Idempotência

```typescript
const stats = this.sqsIdempotencyService.getStats();
/*
{
  totalProcessed: 1500,
  successCount: 1450,
  failureCount: 45,
  retryCount: 5,
  oldestRecord: Date('2024-01-01T10:00:00Z'),
  newestRecord: Date('2024-01-01T15:30:00Z')
}
*/
```

---

## 🏗️ **Arquitetura de Idempotência**

### Componentes

```
┌─────────────────────┐
│   REST Client       │
│                     │
│ Idempotency-Key:    │
│ uuid-12345         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ IdempotencyInterceptor │
│                     │
│ • Extrair chave     │
│ • Verificar cache   │
│ • Validar params    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ IdempotencyService  │
│                     │
│ • Redis/Memory      │
│ • TTL Management    │
│ • Parameter Hash    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Business Logic    │
└─────────────────────┘

───────────────────────────

┌─────────────────────┐
│   SQS Message       │
│                     │
│ MessageId: msg-123  │
│ Body: {...}         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ SQSIdempotencyService │
│                     │
│ • Message tracking  │
│ • Content hash      │
│ • Uniqueness check  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Message Consumer    │
└─────────────────────┘
```

### Armazenamento de Estado

#### Registro de Idempotência (API)
```typescript
interface IdempotencyRecord {
  key: string;                    // Chave fornecida pelo cliente
  userId?: string;                // ID do usuário (escopo)
  endpoint: string;               // Endpoint processado
  method: string;                 // Método HTTP
  parameters: Record<string, any>; // Hash dos parâmetros
  response: {
    statusCode: number;
    body: any;
    headers?: Record<string, string>;
  };
  createdAt: Date;
  expiresAt: Date;
}
```

#### Registro SQS
```typescript
interface SQSIdempotencyRecord {
  messageId: string;              // ID da mensagem
  messageGroupId?: string;        // Grupo FIFO
  deduplicationId?: string;       // ID de deduplicação
  bodyHash: string;               // Hash do conteúdo
  processedAt: Date;
  expiresAt: Date;
  processingResult: 'success' | 'failure' | 'retry';
  metadata?: Record<string, any>;
}
```

---

## ⚙️ **Configuração e Setup**

### 1. Módulo de Idempotência

```typescript
// src/common/modules/idempotency.module.ts
@Module({
  providers: [
    {
      provide: IdempotencyService,
      useClass: RedisIdempotencyService, // ou InMemoryIdempotencyService
    },
    IdempotencyInterceptor,
    SQSIdempotencyService,
  ],
  exports: [IdempotencyService, IdempotencyInterceptor, SQSIdempotencyService],
})
export class IdempotencyModule {}
```

### 2. Aplicação Global

```typescript
// src/app.module.ts
@Module({
  imports: [
    // ... outros módulos
    IdempotencyModule,
  ],
})
export class AppModule {}
```

### 3. Redis Configuration (Opcional)

```typescript
// Para produção, configure Redis
providers: [
  {
    provide: 'REDIS_CLIENT',
    useFactory: () => new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    }),
  },
]
```

---

## 🔧 **Boas Práticas**

### Para APIs REST

1. **Usar UUIDs como chaves**:
   ```typescript
   const idempotencyKey = crypto.randomUUID();
   ```

2. **TTL apropriado**:
   - APIs críticas: 24 horas
   - APIs normais: 1-4 horas
   - APIs temporárias: 15-30 minutos

3. **Escopo adequado**:
   - `user`: Para operações específicas do usuário
   - `global`: Para operações administrativas
   - `endpoint`: Para isolar por endpoint

4. **Validação de parâmetros**:
   ```typescript
   @Idempotent({ validateParameters: true })
   // Garante que retry tenha mesmos parâmetros
   ```

### Para SQS

1. **FIFO Queues para ordem**:
   ```typescript
   // Use FIFO quando ordem importa
   const messageGroupId = `patient-${patientId}`;
   const deduplicationId = generateHash(messageContent);
   ```

2. **Content-based deduplication**:
   ```typescript
   // Para detectar duplicatas semânticas
   const contentHash = createHash('sha256')
     .update(JSON.stringify(message, Object.keys(message).sort()))
     .digest('hex');
   ```

3. **TTL otimizado**:
   - Mensagens críticas: 24-48 horas
   - Mensagens normais: 4-8 horas
   - Mensagens temporárias: 1-2 horas

### Padrões de Erro

```typescript
// Erro de chave duplicada com parâmetros diferentes
{
  "statusCode": 409,
  "message": "Idempotency key reused with different parameters",
  "error": "Conflict",
  "idempotencyKey": "uuid-12345"
}

// Erro de formato de chave inválido
{
  "statusCode": 409,
  "message": "Invalid idempotency key format",
  "error": "Conflict"
}
```

---

## 📊 **Monitoramento e Observabilidade**

### Métricas Importantes

1. **API Idempotency Metrics**:
   - Taxa de cache hits vs misses
   - Distribuição de TTL
   - Erros de validação de parâmetros
   - Chaves reutilizadas

2. **SQS Idempotency Metrics**:
   - Mensagens duplicadas detectadas
   - Taxa de processamento bem-sucedido
   - Mensagens com conteúdo duplicado
   - Tempo de processamento por tipo

### Logs Estruturados

```typescript
// API Idempotency
this.logger.log('Idempotency cache hit', {
  key: 'uuid-12345',
  endpoint: 'POST:/appointments',
  userId: 'user-123',
  cachedResponseAge: '30s'
});

// SQS Idempotency
this.logger.log('Duplicate message detected', {
  messageId: 'msg-456',
  existingMessageId: 'msg-123',
  contentHash: 'sha256-abc123',
  action: 'skipped'
});
```

### Dashboard Sugerido

- **Idempotency Hit Rate**: Percentual de requests que usaram cache
- **Duplicate Message Rate**: Taxa de mensagens duplicadas em SQS
- **Processing Time**: Tempo de processamento por tipo de mensagem
- **Error Rate**: Taxa de erros relacionados à idempotência
- **TTL Distribution**: Distribuição dos tempos de vida dos registros

---

## 🧪 **Testes**

### Teste de Idempotência API

```typescript
describe('API Idempotency', () => {
  it('should return cached response for same idempotency key', async () => {
    const idempotencyKey = 'test-uuid-123';
    const appointmentDto = createValidDto();

    // Primeira requisição
    const response1 = await request(app)
      .post('/appointments')
      .set('Idempotency-Key', idempotencyKey)
      .send(appointmentDto)
      .expect(202);

    // Segunda requisição (mesmo key)
    const response2 = await request(app)
      .post('/appointments')
      .set('Idempotency-Key', idempotencyKey)
      .send(appointmentDto)
      .expect(202);

    expect(response1.body).toEqual(response2.body);
    expect(response2.headers['x-idempotency-cached']).toBe('true');
  });

  it('should fail when parameters differ for same key', async () => {
    const idempotencyKey = 'test-uuid-456';

    // Primeira requisição
    await request(app)
      .post('/appointments')
      .set('Idempotency-Key', idempotencyKey)
      .send({ patientId: 'p1', psychologistId: 'ps1' })
      .expect(202);

    // Segunda requisição com parâmetros diferentes
    await request(app)
      .post('/appointments')
      .set('Idempotency-Key', idempotencyKey)
      .send({ patientId: 'p2', psychologistId: 'ps2' })
      .expect(409);
  });
});
```

### Teste de Idempotência SQS

```typescript
describe('SQS Idempotency', () => {
  it('should skip already processed message', async () => {
    const message = createMockMessage();
    
    // Primeira processamento
    await consumer.handleAppointmentMessage(message);
    
    // Verificar que foi marcado como processado
    const isProcessed = await sqsIdempotencyService.isProcessed(message);
    expect(isProcessed).toBe(true);
    
    // Segunda tentativa de processamento
    await consumer.handleAppointmentMessage(message);
    
    // Verificar que só foi processado uma vez
    expect(mockProcessor.execute).toHaveBeenCalledTimes(1);
  });

  it('should detect duplicate content with different message IDs', async () => {
    const content = { patientId: 'p1', data: 'same-content' };
    const message1 = createMockMessage('msg1', content);
    const message2 = createMockMessage('msg2', content); // Mesmo conteúdo, ID diferente

    await consumer.handleAppointmentMessage(message1);
    await consumer.handleAppointmentMessage(message2);

    // Segunda mensagem deve ser ignorada por conteúdo duplicado
    expect(mockProcessor.execute).toHaveBeenCalledTimes(1);
  });
});
```

---

## 🚨 **Troubleshooting**

### Problemas Comuns

1. **Chaves de idempotência não funcionando**:
   ```bash
   # Verificar formato da chave
   curl -H "Idempotency-Key: invalid@key!" /appointments
   # ❌ Caracteres especiais não são permitidos
   
   curl -H "Idempotency-Key: valid-uuid-123" /appointments
   # ✅ Apenas alfanuméricos, hífens e underscores
   ```

2. **Cache não expirando**:
   ```typescript
   // Verificar TTL nas configurações
   @Idempotent({ ttl: 3600 }) // 1 hora em segundos
   ```

3. **Mensagens SQS processadas múltiplas vezes**:
   ```typescript
   // Verificar se serviço está sendo injetado
   constructor(
     private readonly sqsIdempotencyService: SQSIdempotencyService
   ) {}
   ```

### Debug

```bash
# Verificar logs de idempotência
kubectl logs deployment/appointment-api | grep -i idempotency

# Verificar métricas
curl http://localhost:3000/health/idempotency

# Verificar estado do cache (desenvolvimento)
curl http://localhost:3000/debug/idempotency/stats
```

---

## 📚 **Referências**

### Padrões da Indústria

- **Stripe**: [Idempotent Requests](https://stripe.com/docs/api/idempotent_requests)
- **AWS**: [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
- **PayPal**: [API Design Patterns](https://github.com/paypal/api-standards/blob/master/patterns.md#idempotency)

### RFCs e Especificações

- **RFC 7231**: HTTP/1.1 Semantics (Idempotent Methods)
- **RFC 5789**: PATCH Method for HTTP (Idempotency considerations)

### Ferramentas Relacionadas

- **Redis**: Para armazenamento de estado distribuído
- **AWS SQS**: Filas com deduplicação nativa
- **Prometheus**: Métricas de observabilidade

---

**✨ Com essa implementação, nossa API está preparada para cenários de produção com retry seguro e processamento consistente! 🎉**