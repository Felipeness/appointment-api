#!/bin/bash

# Configurações
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando Sistema de Agendamentos...${NC}"
echo "========================================="

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando. Por favor, inicie o Docker primeiro.${NC}"
    exit 1
fi

# Parar containers existentes se houver
echo -e "${YELLOW}📦 Parando containers existentes...${NC}"
DOCKER_CONFIG="" docker-compose -f docker-compose.complete.yml down --remove-orphans

# Limpar volumes órfãos se necessário
echo -e "${YELLOW}🧹 Limpando volumes órfãos...${NC}"
docker volume prune -f > /dev/null 2>&1 || true

# Iniciar todo o sistema
echo -e "${BLUE}🔧 Iniciando toda a infraestrutura...${NC}"
echo "⏳ Isso pode levar alguns minutos na primeira execução..."

# Executar em background se passado o argumento -d
if [ "$1" = "-d" ]; then
    DOCKER_CONFIG="" docker-compose -f docker-compose.complete.yml up -d
    echo -e "${GREEN}✅ Sistema iniciado em modo detached!${NC}"
    echo "📊 Para ver logs: docker-compose -f docker-compose.complete.yml logs -f"
else
    DOCKER_CONFIG="" docker-compose -f docker-compose.complete.yml up
fi

echo -e "${GREEN}✅ Sistema disponível em:${NC}"
echo -e "📄 ${BLUE}API: http://localhost:3000${NC}"
echo -e "📚 ${BLUE}Swagger: http://localhost:3000/api${NC}"
echo -e "🐘 ${BLUE}PostgreSQL: localhost:5432 (postgres/postgres)${NC}"
echo -e "📡 ${BLUE}Redis: localhost:6379${NC}"
echo -e "☁️  ${BLUE}LocalStack: http://localhost:4566${NC}"
echo -e "${YELLOW}💡 Para testar a API: ./test-api.sh${NC}"