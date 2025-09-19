# 🎯 Comandos de Demonstração por Seção

## 📋 Clean Architecture - Camadas

### **1. Presentation Layer**
```bash
# Verificar controllers
find src/presentation/controllers -name "*.ts" | head -5

# Testar endpoint
curl http://localhost:3000

# Swagger
curl http://localhost:3000/api-json
# Para formato mais legível, instale jq: sudo apt install jq
# curl http://localhost:3000/api-json | jq '.paths | keys'
```

### **2. Application Layer**
```bash
# Use Cases implementados
find src/application/use-cases -name "*.ts" -exec basename {} .ts \;

# DTOs
find src/application/dtos -name "*.ts" -exec basename {} .ts \;
```

### **3. Domain Layer (DDD)**
```bash
# Entidades do domínio
find src/domain/entities -name "*.ts" -exec basename {} .ts \;

# Value Objects
find src/domain/value-objects -name "*.ts" -exec basename {} .ts \;

# Repository interfaces
find src/domain/repositories -name "*.ts" -exec basename {} .ts \;
```

### **4. Infrastructure Layer**
```bash
# Implementações de repositórios
find src/infrastructure/database/repositories -name "*.ts" -exec basename {} .ts \;

# Serviços de mensageria
find src/infrastructure/messaging -name "*.ts" -exec basename {} .ts \;
```

## 🚀 Event-Driven Architecture (EDA)

### **Demonstração Completa de EDA**
```bash
# 1. Verificar fila SQS vazia
docker exec appointment-localstack awslocal sqs get-queue-attributes \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/appointment-queue \
  --attribute-names ApproximateNumberOfMessages | jq '.Attributes.ApproximateNumberOfMessages'

# 2. Criar agendamento (gera evento)
TRACE_ID="eda-demo-$(date +%s)"
curl -X POST http://localhost:3000/appointments \
  -H 'Content-Type: application/json' \
  -H "x-correlation-id: $TRACE_ID" \
  -d "{
    \"appointmentId\": \"eda-demo-$(uuidgen)\",
    \"patientEmail\": \"eda-demo@enterprise.com\",
    \"patientName\": \"EDA Demo User\",
    \"psychologistId\": \"psych_001_maria_silva\",
    \"scheduledAt\": \"2026-12-25T10:00:00.000Z\",
    \"appointmentType\": \"CONSULTATION\",
    \"traceId\": \"$TRACE_ID\"
  }"

# 3. Verificar evento na fila
docker exec appointment-localstack awslocal sqs get-queue-attributes \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/appointment-queue \
  --attribute-names ApproximateNumberOfMessages | jq '.Attributes.ApproximateNumberOfMessages'

# 4. Verificar logs com trace ID
docker-compose -f docker-compose.complete.yml logs app | grep "$TRACE_ID" | tail -5
```

## 🔄 Saga Pattern - Transação Distribuída

### **Demonstrar Saga Steps**
```bash
# Ver implementação das etapas da saga
grep -n "id:" src/application/use-cases/resilient-process-appointment.use-case.ts

# Mostrar steps implementados
echo "Saga Steps:"
echo "1. validate-patient"
echo "2. validate-psychologist"
echo "3. check-availability"
echo "4. save-appointment"
echo "5. send-confirmation"

# Verificar logs de saga
docker-compose -f docker-compose.complete.yml logs app | grep -i saga | tail -3
```

## 📤 Outbox Pattern - Messaging Transacional

### **Demonstrar Outbox Events**
```bash
# Ver eventos no outbox
docker exec appointment-postgres psql -U postgres -d appointment_test_db \
  -c "SELECT id, event_type, status, created_at FROM outbox_events ORDER BY created_at DESC LIMIT 5;"

# Contar eventos por status
docker exec appointment-postgres psql -U postgres -d appointment_test_db \
  -c "SELECT status, COUNT(*) FROM outbox_events GROUP BY status;"

# Ver schema do outbox
docker exec appointment-postgres psql -U postgres -d appointment_test_db \
  -c "\d outbox_events"
```

## 🔍 CQRS - Command Query Separation

### **Commands (Escrita)**
```bash
# Criar agendamento (Command)
curl -X POST http://localhost:3000/appointments \
  -H 'Content-Type: application/json' \
  -d '{
    "appointmentId": "cqrs-command-demo",
    "patientEmail": "cqrs@demo.com",
    "psychologistId": "psych_001_maria_silva",
    "scheduledAt": "2026-12-25T14:00:00.000Z"
  }'

# Criar em lote (Batch Command)
curl -X POST http://localhost:3000/appointments/batch \
  -H 'Content-Type: application/json' \
  -d '{
    "appointments": [
      {
        "appointmentId": "batch-1",
        "patientEmail": "batch1@demo.com",
        "psychologistId": "psych_002_joao_santos",
        "scheduledAt": "2026-12-26T10:00:00.000Z"
      }
    ]
  }'
```

### **Queries (Leitura)**
```bash
# Listar todos (Query)
curl "http://localhost:3000/appointments?limit=5"

# Query com filtros
curl "http://localhost:3000/appointments?psychologistId=psych_001_maria_silva&limit=3"

# Query ordenada
curl "http://localhost:3000/appointments?sortBy=createdAt&sortOrder=desc&limit=3"

# Query paginada
curl "http://localhost:3000/appointments?page=1&limit=2"
```

## 🔧 Infrastructure - Serviços

### **Database (PostgreSQL)**
```bash
# Status do banco
docker exec appointment-postgres pg_isready -U postgres

# Estatísticas
docker exec appointment-postgres psql -U postgres -d appointment_test_db \
  -c "SELECT 'Total Appointments' as metric, COUNT(*) as value FROM appointments
      UNION ALL
      SELECT 'Total Patients', COUNT(*) FROM patients
      UNION ALL
      SELECT 'Total Psychologists', COUNT(*) FROM psychologists;"

# Últimos agendamentos
docker exec appointment-postgres psql -U postgres -d appointment_test_db \
  -c "SELECT appointment_id, status, scheduled_at FROM appointments ORDER BY created_at DESC LIMIT 3;"
```

### **Cache (Redis)**
```bash
# Status do Redis
docker exec appointment-redis redis-cli ping

# Estatísticas
docker exec appointment-redis redis-cli info stats | grep -E 'connected_clients|total_commands_processed|used_memory_human'

# Keys (se houver)
docker exec appointment-redis redis-cli keys "*" | head -5
```

### **Message Queue (SQS)**
```bash
# Listar filas
docker exec appointment-localstack awslocal sqs list-queues

# Atributos da fila
docker exec appointment-localstack awslocal sqs get-queue-attributes \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/appointment-queue \
  --attribute-names All | jq '.Attributes | {ApproximateNumberOfMessages, ApproximateNumberOfMessagesNotVisible, CreatedTimestamp}'
```

## 📊 Observabilidade & Monitoring

### **Health Checks**
```bash
# API Health
curl http://localhost:3000/security/health

# Containers Status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep appointment

# Resources Usage
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep appointment
```

### **Logs & Tracing**
```bash
# Logs da aplicação
docker-compose -f docker-compose.complete.yml logs app --tail=10

# Logs com trace específico
TRACE_ID="your-trace-id"
docker-compose -f docker-compose.complete.yml logs app | grep "$TRACE_ID"

# Logs de todos os serviços
docker-compose -f docker-compose.complete.yml logs --tail=5
```

## 🎯 Demonstração Completa - Fluxo End-to-End

```bash
# 1. Gerar IDs únicos
APPOINTMENT_ID=$(uuidgen)
TRACE_ID="e2e-demo-$(date +%s)"

echo "🆔 Appointment ID: $APPOINTMENT_ID"
echo "🔍 Trace ID: $TRACE_ID"

# 2. Estado inicial
echo "📊 Estado inicial:"
curl -s "http://localhost:3000/appointments?limit=1" | jq '.total'

# 3. Criar agendamento
echo "📝 Criando agendamento..."
curl -X POST http://localhost:3000/appointments \
  -H 'Content-Type: application/json' \
  -H "x-correlation-id: $TRACE_ID" \
  -d "{
    \"appointmentId\": \"$APPOINTMENT_ID\",
    \"patientEmail\": \"e2e-demo@enterprise.com\",
    \"patientName\": \"End-to-End Demo\",
    \"psychologistId\": \"psych_001_maria_silva\",
    \"scheduledAt\": \"2026-12-25T15:00:00.000Z\",
    \"appointmentType\": \"THERAPY_SESSION\",
    \"meetingType\": \"VIDEO_CALL\",
    \"reason\": \"Demonstração completa E2E\",
    \"traceId\": \"$TRACE_ID\"
  }" | jq .

# 4. Verificar processamento
echo "⚡ Verificando processamento..."
sleep 2
docker-compose -f docker-compose.complete.yml logs app | grep "$TRACE_ID" | tail -3

# 5. Estado final
echo "📊 Estado final:"
curl -s "http://localhost:3000/appointments?limit=1" | jq '.total'

# 6. Verificar outbox
echo "📤 Eventos outbox:"
docker exec appointment-postgres psql -U postgres -d appointment_test_db \
  -c "SELECT event_type, status FROM outbox_events ORDER BY created_at DESC LIMIT 2;"

echo "✅ Demonstração E2E concluída!"
```

---

**Execute cada seção conforme apresenta:**
1. **Arquitetura** → Mostrar estrutura de pastas
2. **EDA** → Executar fluxo completo de evento
3. **Saga** → Mostrar steps e compensação
4. **CQRS** → Demonstrar Commands vs Queries
5. **Outbox** → Mostrar consistência transacional
6. **Observability** → Trace IDs e logs
7. **E2E** → Fluxo completo end-to-end
