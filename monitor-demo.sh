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

echo -e "${BLUE}🔍 MONITOR DE DEMONSTRAÇÃO ENTERPRISE API${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}Execute este script em um terminal separado durante a demo${NC}\n"

# Função para monitorar logs
monitor_logs() {
    local service=$1
    local title=$2
    echo -e "${WHITE}════ $title ═════${NC}"
    case $service in
        "api")
            docker-compose -f docker-compose.complete.yml logs -f app | grep -E "(LOG|ERROR|WARN)" | tail -20
            ;;
        "postgres")
            docker-compose -f docker-compose.complete.yml logs -f postgres | tail -10
            ;;
        "redis")
            docker-compose -f docker-compose.complete.yml logs -f redis | tail -10
            ;;
        "localstack")
            docker-compose -f docker-compose.complete.yml logs -f localstack | tail -10
            ;;
        "all")
            docker-compose -f docker-compose.complete.yml logs -f --tail=5
            ;;
    esac
}

# Menu de opções
echo -e "${CYAN}Escolha o que monitorar:${NC}"
echo "1. API NestJS (Logs da aplicação)"
echo "2. PostgreSQL (Database logs)"
echo "3. Redis (Cache logs)"
echo "4. LocalStack (SQS/AWS logs)"
echo "5. Todos os serviços"
echo "6. Monitor de performance em tempo real"
echo "7. Monitor de eventos EDA"

read -p "Opção (1-7): " option

case $option in
    1)
        monitor_logs "api" "API NESTJS - LOGS DA APLICAÇÃO"
        ;;
    2)
        monitor_logs "postgres" "POSTGRESQL - DATABASE LOGS"
        ;;
    3)
        monitor_logs "redis" "REDIS - CACHE LOGS"
        ;;
    4)
        monitor_logs "localstack" "LOCALSTACK - AWS SERVICES LOGS"
        ;;
    5)
        monitor_logs "all" "TODOS OS SERVIÇOS"
        ;;
    6)
        echo -e "${WHITE}════ MONITOR DE PERFORMANCE ═════${NC}"
        while true; do
            clear
            echo -e "${GREEN}📊 Performance Monitor - $(date)${NC}"
            echo -e "${WHITE}═══════════════════════════════════════════════${NC}"

            # API Status
            echo -e "${BLUE}🔧 API Status:${NC}"
            curl -s http://localhost:3000 > /dev/null && echo -e "   ✅ API Online" || echo -e "   ❌ API Offline"

            # Database
            echo -e "${BLUE}🗃️  Database:${NC}"
            docker exec appointment-postgres pg_isready -U postgres > /dev/null 2>&1 && echo -e "   ✅ PostgreSQL Online" || echo -e "   ❌ PostgreSQL Offline"

            # Redis
            echo -e "${BLUE}📡 Cache:${NC}"
            docker exec appointment-redis redis-cli ping > /dev/null 2>&1 && echo -e "   ✅ Redis Online" || echo -e "   ❌ Redis Offline"

            # SQS
            echo -e "${BLUE}📬 Message Queue:${NC}"
            docker exec appointment-localstack awslocal sqs list-queues > /dev/null 2>&1 && echo -e "   ✅ SQS Online" || echo -e "   ❌ SQS Offline"

            # Containers Status
            echo -e "\n${BLUE}📦 Containers:${NC}"
            docker ps --format "table {{.Names}}\t{{.Status}}" | grep appointment

            # Memory Usage
            echo -e "\n${BLUE}💾 Memory Usage:${NC}"
            docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep appointment

            sleep 5
        done
        ;;
    7)
        echo -e "${WHITE}════ MONITOR DE EVENTOS EDA ═════${NC}"
        while true; do
            clear
            echo -e "${GREEN}📡 Event-Driven Architecture Monitor - $(date)${NC}"
            echo -e "${WHITE}═══════════════════════════════════════════════════════════${NC}"

            # SQS Queue Status
            echo -e "${BLUE}📬 SQS Queue Status:${NC}"
            QUEUE_MSGS=$(docker exec appointment-localstack awslocal sqs get-queue-attributes --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/appointment-queue --attribute-names ApproximateNumberOfMessages 2>/dev/null | grep -o '"ApproximateNumberOfMessages": "[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "0")
            echo -e "   📊 Messages in Queue: ${CYAN}$QUEUE_MSGS${NC}"

            # Outbox Events
            echo -e "\n${BLUE}📤 Outbox Events:${NC}"
            PENDING_EVENTS=$(docker exec appointment-postgres psql -U postgres -d appointment_test_db -t -c "SELECT COUNT(*) FROM outbox_events WHERE status = 'PENDING';" 2>/dev/null | tr -d ' ' || echo "0")
            PROCESSED_EVENTS=$(docker exec appointment-postgres psql -U postgres -d appointment_test_db -t -c "SELECT COUNT(*) FROM outbox_events WHERE status = 'PROCESSED';" 2>/dev/null | tr -d ' ' || echo "0")
            echo -e "   ⏳ Pending: ${YELLOW}$PENDING_EVENTS${NC}"
            echo -e "   ✅ Processed: ${GREEN}$PROCESSED_EVENTS${NC}"

            # Recent Events
            echo -e "\n${BLUE}🕐 Recent Events:${NC}"
            docker exec appointment-postgres psql -U postgres -d appointment_test_db -c "SELECT event_type, status, created_at FROM outbox_events ORDER BY created_at DESC LIMIT 3;" 2>/dev/null || echo "   No events found"

            # API Requests
            echo -e "\n${BLUE}🌐 Recent API Activity:${NC}"
            docker-compose -f docker-compose.complete.yml logs app --tail=3 --since=10s | grep -E "(POST|GET)" | tail -3 || echo "   No recent activity"

            sleep 3
        done
        ;;
    *)
        echo -e "${RED}Opção inválida!${NC}"
        exit 1
        ;;
esac