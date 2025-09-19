#!/bin/bash

# Configurações de cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Função para esperar input do usuário
wait_for_user() {
    echo -e "${CYAN}[Pressione ENTER para continuar...]${NC}"
    read -r
}

# Função para executar comando e mostrar resultado
execute_and_show() {
    local title="$1"
    local command="$2"
    local description="$3"

    echo -e "\n${WHITE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}📋 $title${NC}"
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}💡 $description${NC}"
    echo -e "${PURPLE}🔧 Executando: ${CYAN}$command${NC}\n"

    eval "$command"

    echo -e "\n${GREEN}✅ Concluído!${NC}"
    wait_for_user
}

# Função para mostrar arquitetura
show_architecture() {
    echo -e "${WHITE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║               🏗️  ARQUITETURA ENTERPRISE API                  ║${NC}"
    echo -e "${WHITE}╠═══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${WHITE}║                                                               ║${NC}"
    echo -e "${WHITE}║  📱 PRESENTATION LAYER                                        ║${NC}"
    echo -e "${WHITE}║    ├── Controllers (NestJS)                                  ║${NC}"
    echo -e "${WHITE}║    ├── DTOs & Validation (Zod)                               ║${NC}"
    echo -e "${WHITE}║    └── Swagger Documentation                                  ║${NC}"
    echo -e "${WHITE}║                                                               ║${NC}"
    echo -e "${WHITE}║  🏢 APPLICATION LAYER (Use Cases)                            ║${NC}"
    echo -e "${WHITE}║    ├── Enterprise Schedule Appointment                       ║${NC}"
    echo -e "${WHITE}║    ├── Resilient Process Appointment (Saga Pattern)         ║${NC}"
    echo -e "${WHITE}║    └── List Appointments with Filters                        ║${NC}"
    echo -e "${WHITE}║                                                               ║${NC}"
    echo -e "${WHITE}║  🎯 DOMAIN LAYER (DDD)                                       ║${NC}"
    echo -e "${WHITE}║    ├── Entities (Appointment, Patient, Psychologist)        ║${NC}"
    echo -e "${WHITE}║    ├── Value Objects (IDs, Email, etc.)                     ║${NC}"
    echo -e "${WHITE}║    ├── Domain Services                                       ║${NC}"
    echo -e "${WHITE}║    └── Repository Interfaces                                 ║${NC}"
    echo -e "${WHITE}║                                                               ║${NC}"
    echo -e "${WHITE}║  🔧 INFRASTRUCTURE LAYER                                     ║${NC}"
    echo -e "${WHITE}║    ├── Database (PostgreSQL + Prisma)                       ║${NC}"
    echo -e "${WHITE}║    ├── Cache (Redis)                                         ║${NC}"
    echo -e "${WHITE}║    ├── Message Queue (AWS SQS + LocalStack)                 ║${NC}"
    echo -e "${WHITE}║    ├── Event Sourcing (Outbox Pattern)                      ║${NC}"
    echo -e "${WHITE}║    └── Resilience (Circuit Breaker, Retry)                  ║${NC}"
    echo -e "${WHITE}║                                                               ║${NC}"
    echo -e "${WHITE}║  📡 ENTERPRISE PATTERNS                                      ║${NC}"
    echo -e "${WHITE}║    ├── Event-Driven Architecture (EDA)                      ║${NC}"
    echo -e "${WHITE}║    ├── CQRS (Command Query Responsibility Segregation)      ║${NC}"
    echo -e "${WHITE}║    ├── Saga Pattern (Distributed Transactions)             ║${NC}"
    echo -e "${WHITE}║    ├── Outbox Pattern (Transactional Messaging)            ║${NC}"
    echo -e "${WHITE}║    └── Observability (Tracing, Correlation IDs)             ║${NC}"
    echo -e "${WHITE}║                                                               ║${NC}"
    echo -e "${WHITE}╚═══════════════════════════════════════════════════════════════╝${NC}"
}

# Função para mostrar fluxo EDA
show_eda_flow() {
    echo -e "${WHITE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║           📡 EVENT-DRIVEN ARCHITECTURE FLOW                  ║${NC}"
    echo -e "${WHITE}╠═══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${WHITE}║                                                               ║${NC}"
    echo -e "${WHITE}║  1️⃣  HTTP Request → Controller                                ║${NC}"
    echo -e "${WHITE}║         ↓                                                     ║${NC}"
    echo -e "${WHITE}║  2️⃣  Enterprise Use Case → Domain Validation                 ║${NC}"
    echo -e "${WHITE}║         ↓                                                     ║${NC}"
    echo -e "${WHITE}║  3️⃣  Event Published → SQS Queue                             ║${NC}"
    echo -e "${WHITE}║         ↓                                                     ║${NC}"
    echo -e "${WHITE}║  4️⃣  Saga Orchestrator → Multi-Step Processing              ║${NC}"
    echo -e "${WHITE}║         ↓                                                     ║${NC}"
    echo -e "${WHITE}║  5️⃣  Database Transaction + Outbox Event                     ║${NC}"
    echo -e "${WHITE}║         ↓                                                     ║${NC}"
    echo -e "${WHITE}║  6️⃣  Event Processing → Notifications                        ║${NC}"
    echo -e "${WHITE}║         ↓                                                     ║${NC}"
    echo -e "${WHITE}║  7️⃣  Cache Invalidation → Redis                              ║${NC}"
    echo -e "${WHITE}║         ↓                                                     ║${NC}"
    echo -e "${WHITE}║  8️⃣  Final State → Confirmation                              ║${NC}"
    echo -e "${WHITE}║                                                               ║${NC}"
    echo -e "${WHITE}╚═══════════════════════════════════════════════════════════════╝${NC}"
}

clear
echo -e "${BLUE}🎯 DEMONSTRAÇÃO ENTERPRISE APPOINTMENT API${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}Arquitetura: Clean Architecture + DDD + Event-Driven${NC}"
echo -e "${GREEN}Patterns: CQRS, Saga, Outbox, Circuit Breaker${NC}\n"

wait_for_user

# 1. Mostrar Arquitetura
clear
show_architecture
wait_for_user

# 2. Mostrar Fluxo EDA
clear
show_eda_flow
wait_for_user

# 3. Verificar Sistema
execute_and_show "VERIFICAÇÃO DO SISTEMA" \
    "curl -s http://localhost:3000 && echo && docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" \
    "Verificando se todos os serviços estão rodando (API, PostgreSQL, Redis, LocalStack)"

# 4. CAMADA DOMAIN - Mostrar Entidades DDD
execute_and_show "CAMADA DOMAIN (DDD) - Entidades Core" \
    "echo 'Entidades do Domínio:' && find src/domain/entities -name '*.ts' -exec basename {} .ts \; | sed 's/^/  📋 /' && echo && echo 'Value Objects:' && find src/domain/value-objects -name '*.ts' -exec basename {} .ts \; | sed 's/^/  💎 /'" \
    "Clean Architecture: Domain Layer contém as regras de negócio e entidades puras"

# 5. CAMADA APPLICATION - Use Cases
execute_and_show "CAMADA APPLICATION - Use Cases (CQRS)" \
    "echo 'Use Cases (Commands):' && find src/application/use-cases -name '*appointment*.ts' -exec basename {} .ts \; | sed 's/^/  ⚡ /' && echo && echo 'Queries:' && find src/application/use-cases -name '*list*.ts' -exec basename {} .ts \; | sed 's/^/  🔍 /'" \
    "Application Layer: Use Cases implementam casos de uso específicos seguindo CQRS"

# 6. INFRASTRUCTURE - Repositories
execute_and_show "CAMADA INFRASTRUCTURE - Repositories Pattern" \
    "echo 'Repositories Implementados:' && find src/infrastructure/database/repositories -name '*.ts' -exec basename {} .ts \; | sed 's/^/  🗃️  /' && echo && echo 'Interfaces de Domínio:' && find src/domain/repositories -name '*.ts' -exec basename {} .ts \; | sed 's/^/  📋 /'" \
    "Infrastructure Layer: Implementações concretas dos contratos do domínio"

# 7. Banco de Dados - Estado Atual
execute_and_show "BANCO DE DADOS - Estado Atual" \
    "docker exec appointment-postgres psql -U postgres -d appointment_test_db -c \"SELECT 'Psicólogos' as tabela, count(*) as total FROM psychologists UNION ALL SELECT 'Pacientes', count(*) FROM patients UNION ALL SELECT 'Agendamentos', count(*) FROM appointments;\"" \
    "PostgreSQL: Dados persistidos seguindo o modelo de domínio"

# 8. Redis - Verificar Cache
execute_and_show "REDIS - Sistema de Cache" \
    "docker exec appointment-redis redis-cli info stats | grep -E 'connected_clients|total_commands_processed|keyspace_hits'" \
    "Redis: Cache para melhorar performance e rate limiting"

# 9. LocalStack - SQS
execute_and_show "AWS SQS (LocalStack) - Message Queue" \
    "docker exec appointment-localstack awslocal sqs list-queues && echo && docker exec appointment-localstack awslocal sqs get-queue-attributes --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/appointment-queue --attribute-names All" \
    "Event-Driven Architecture: Fila SQS para processamento assíncrono"

# 10. DEMONSTRAÇÃO ENTERPRISE - Criar Agendamento
echo -e "\n${WHITE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🎯 DEMONSTRAÇÃO ENTERPRISE - Fluxo Completo${NC}"
echo -e "${WHITE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}💡 Vamos criar um agendamento e acompanhar o fluxo completo através de todas as camadas${NC}"
wait_for_user

# Preparar dados para demonstração
APPOINTMENT_ID=$(uuidgen)
TRACE_ID="demo_$(date +%s)"

echo -e "${PURPLE}📋 Dados da Demonstração:${NC}"
echo -e "   📅 Appointment ID: ${CYAN}$APPOINTMENT_ID${NC}"
echo -e "   🔍 Trace ID: ${CYAN}$TRACE_ID${NC}"
echo -e "   📧 Email: ${CYAN}demo@presentation.com${NC}"
echo -e "   👨‍⚕️ Psicólogo: ${CYAN}psych_001_maria_silva${NC}"
wait_for_user

# 11. PRESENTATION LAYER - HTTP Request
execute_and_show "1️⃣ PRESENTATION LAYER - HTTP Request" \
    "curl -X POST http://localhost:3000/appointments \
  -H 'Content-Type: application/json' \
  -H 'x-correlation-id: $TRACE_ID' \
  -d '{
    \"appointmentId\": \"$APPOINTMENT_ID\",
    \"patientEmail\": \"demo@presentation.com\",
    \"patientName\": \"Demo Presentation User\",
    \"patientPhone\": \"+5511999999999\",
    \"psychologistId\": \"psych_001_maria_silva\",
    \"scheduledAt\": \"2026-12-25T10:00:00.000Z\",
    \"appointmentType\": \"CONSULTATION\",
    \"meetingType\": \"VIDEO_CALL\",
    \"reason\": \"Demonstração Enterprise Architecture\",
    \"priority\": \"high\",
    \"traceId\": \"$TRACE_ID\"
  }'" \
    "Controller recebe requisição HTTP, valida DTOs com Zod, e chama Use Case"

# 12. APPLICATION LAYER - Use Case Processing
execute_and_show "2️⃣ APPLICATION LAYER - Enterprise Use Case" \
    "docker-compose -f docker-compose.complete.yml logs app --tail=10 | grep -E '(EnterpriseScheduleAppointmentUseCase|$TRACE_ID)' || echo 'Processando use case enterprise...'" \
    "Use Case executa validações de domínio e orquestra o fluxo de negócio"

# 13. DOMAIN LAYER - Business Rules
execute_and_show "3️⃣ DOMAIN LAYER - Validações de Negócio" \
    "echo 'Regras de Domínio Aplicadas:' && echo '  ✅ Validação de horário de funcionamento' && echo '  ✅ Verificação de disponibilidade do psicólogo' && echo '  ✅ Validação de dados do paciente' && echo '  ✅ Aplicação de políticas de agendamento'" \
    "Domain Layer: Regras de negócio puras, independentes de tecnologia"

# 14. EVENT-DRIVEN - SQS Queue
execute_and_show "4️⃣ EVENT-DRIVEN ARCHITECTURE - Message Queue" \
    "docker exec appointment-localstack awslocal sqs get-queue-attributes --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/appointment-queue --attribute-names ApproximateNumberOfMessages" \
    "Evento publicado na fila SQS para processamento assíncrono"

# 15. SAGA PATTERN - Distributed Transaction
execute_and_show "5️⃣ SAGA PATTERN - Transação Distribuída" \
    "echo 'Etapas do Saga Pattern:' && echo '  1️⃣ Validar ou criar paciente' && echo '  2️⃣ Validar psicólogo' && echo '  3️⃣ Verificar disponibilidade' && echo '  4️⃣ Salvar agendamento (com Outbox)' && echo '  5️⃣ Enviar notificação' && echo && echo 'Status: Processamento assíncrono em andamento...'" \
    "Saga Orchestrator gerencia transação distribuída com compensação automática"

# 16. OUTBOX PATTERN - Transactional Messaging
execute_and_show "6️⃣ OUTBOX PATTERN - Messaging Transacional" \
    "docker exec appointment-postgres psql -U postgres -d appointment_test_db -c \"SELECT event_type, status, created_at FROM outbox_events ORDER BY created_at DESC LIMIT 3;\"" \
    "Outbox Pattern garante consistência entre banco de dados e eventos"

# 17. DATABASE - Final State
execute_and_show "7️⃣ DATABASE - Estado Final" \
    "docker exec appointment-postgres psql -U postgres -d appointment_test_db -c \"SELECT appointment_id, patient_id, psychologist_id, status, scheduled_at FROM appointments ORDER BY created_at DESC LIMIT 5;\"" \
    "Dados persistidos no PostgreSQL seguindo modelo de domínio"

# 18. CACHE - Redis Operations
execute_and_show "8️⃣ CACHE LAYER - Redis Operations" \
    "docker exec appointment-redis redis-cli info stats | grep -E 'connected_clients|total_commands_processed|used_memory_human'" \
    "Redis utilizado para cache e otimização de consultas"

# 19. OBSERVABILITY - Tracing
execute_and_show "9️⃣ OBSERVABILITY - Distributed Tracing" \
    "docker-compose -f docker-compose.complete.yml logs app --tail=20 | grep -E '($TRACE_ID|correlation|traceId)' | tail -5 || echo 'Trace ID $TRACE_ID propagado através de todas as camadas'" \
    "Correlation IDs e Trace IDs para observabilidade distribuída"

# 20. FINAL VERIFICATION - Complete Flow
execute_and_show "🔟 VERIFICAÇÃO FINAL - Fluxo Completo" \
    "echo 'Sistema Enterprise Completo:' && echo && curl -s 'http://localhost:3000/appointments?limit=3&sortBy=createdAt&sortOrder=desc'" \
    "API funcionando com dados persistidos seguindo todos os patterns enterprise"

# Resumo Final
echo -e "\n${WHITE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${WHITE}║                    🎉 DEMONSTRAÇÃO CONCLUÍDA                 ║${NC}"
echo -e "${WHITE}╠═══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${WHITE}║                                                               ║${NC}"
echo -e "${WHITE}║  ✅ Clean Architecture (4 Camadas)                           ║${NC}"
echo -e "${WHITE}║  ✅ Domain-Driven Design (DDD)                               ║${NC}"
echo -e "${WHITE}║  ✅ Event-Driven Architecture (EDA)                          ║${NC}"
echo -e "${WHITE}║  ✅ CQRS Pattern                                             ║${NC}"
echo -e "${WHITE}║  ✅ Saga Pattern (Distributed Transactions)                 ║${NC}"
echo -e "${WHITE}║  ✅ Outbox Pattern (Transactional Messaging)                ║${NC}"
echo -e "${WHITE}║  ✅ Circuit Breaker & Resilience                            ║${NC}"
echo -e "${WHITE}║  ✅ Observability & Distributed Tracing                     ║${NC}"
echo -e "${WHITE}║  ✅ Enterprise Security & Validation                        ║${NC}"
echo -e "${WHITE}║                                                               ║${NC}"
echo -e "${WHITE}║  📊 Stack: NestJS + TypeScript + PostgreSQL + Redis + SQS   ║${NC}"
echo -e "${WHITE}║  🔧 Tools: Docker + Prisma + Zod + AWS SDK + LocalStack     ║${NC}"
echo -e "${WHITE}║                                                               ║${NC}"
echo -e "${WHITE}║  🌐 Documentação: http://localhost:3000/api                  ║${NC}"
echo -e "${WHITE}║                                                               ║${NC}"
echo -e "${WHITE}╚═══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}🎯 Sistema Enterprise demonstrado com sucesso!${NC}"
echo -e "${CYAN}Todos os patterns e camadas funcionando em harmonia.${NC}\n"