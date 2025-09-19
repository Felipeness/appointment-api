# 🚀 Sistema de Agendamentos - Execução com Docker

## 🎯 Início Rápido (1 comando!)

```bash
./start-system.sh
```

Isso irá:
- ✅ Iniciar PostgreSQL, Redis, LocalStack (SQS) e a API
- ✅ Executar migrações do banco
- ✅ Popular dados de teste (seed)
- ✅ Criar fila SQS
- ✅ Iniciar a aplicação

## 🧪 Testar a API

Após o sistema iniciar, execute:

```bash
./test-api.sh
```

### Testes incluídos:

1. **📅 Data inválida**: Agendamento com menos de 24h → ❌ Erro amigável
2. **👤 Psicólogo inexistente**: ID inválido → ❌ Erro amigável  
3. **✅ Agendamento válido**: Dados corretos → ✅ Sucesso com ID
4. **🚨 Emergência**: Alta prioridade → ✅ Processamento prioritário

## 📋 Mensagens Amigáveis do Sistema

### ❌ Erros Esperados:
- *"Appointments must be scheduled at least 24 hours in advance"*
- *"Psychologist [ID] not found"*
- *"Psychologist [ID] is not active"*

### ✅ Sucessos:
- *"Appointment request queued for enterprise processing"*
- Retorna: `appointmentId`, `status: "queued"`, `priority`, `traceId`

## 🔗 Links Úteis

- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **LocalStack**: localhost:4566

## 🛑 Parar o Sistema

```bash
docker-compose -f docker-compose.complete.yml down
```

## 📊 Monitoramento

Os logs mostram em tempo real:
- ✅ Validações executadas
- ✅ Mensagens enviadas para SQS
- ✅ IDs de rastreamento
- ✅ Tempos de processamento
- ✅ Prioridades das mensagens

## 🔧 Arquitetura Incluída

- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e idempotência 
- **LocalStack**: SQS local para desenvolvimento
- **NestJS**: API REST com validações
- **Prisma**: ORM e migrações
- **Circuit Breaker**: Resiliência
- **Swagger**: Documentação automática

---

**🎉 Pronto! Sistema 100% funcional com 1 comando!**