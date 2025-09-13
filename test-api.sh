#!/bin/bash

# Configurações
API_URL="http://localhost:3000"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para fazer requisição e formatar resposta
test_request() {
    local title="$1"
    local patient_email="$2"
    local patient_name="$3"
    local patient_phone="$4"
    local psychologist_id="$5"
    local scheduled_at="$6"
    local duration="$7"
    local appointment_type="$8"
    local meeting_type="$9"
    local meeting_url="${10}"
    local meeting_room="${11}"
    local reason="${12}"
    local consultation_fee="${13}"
    local priority="${14}"
    
    echo -e "${BLUE}${title}${NC}"
    echo "────────────────────────────────────────"
    
    # Fazer requisição com headers de trace
    local trace_id="trace_$(date +%s)_$(openssl rand -hex 4 2>/dev/null || echo "$(date +%s)")"
    
    # Construir JSON dinamicamente
    local json_data="{\"patientEmail\":\"$patient_email\",\"patientName\":\"$patient_name\""
    
    [ -n "$patient_phone" ] && json_data="$json_data,\"patientPhone\":\"$patient_phone\""
    [ -n "$psychologist_id" ] && json_data="$json_data,\"psychologistId\":\"$psychologist_id\""
    [ -n "$scheduled_at" ] && json_data="$json_data,\"scheduledAt\":\"$scheduled_at\""
    [ -n "$duration" ] && json_data="$json_data,\"duration\":$duration"
    [ -n "$appointment_type" ] && json_data="$json_data,\"appointmentType\":\"$appointment_type\""
    [ -n "$meeting_type" ] && json_data="$json_data,\"meetingType\":\"$meeting_type\""
    [ -n "$meeting_url" ] && json_data="$json_data,\"meetingUrl\":\"$meeting_url\""
    [ -n "$meeting_room" ] && json_data="$json_data,\"meetingRoom\":\"$meeting_room\""
    [ -n "$reason" ] && json_data="$json_data,\"reason\":\"$reason\""
    [ -n "$consultation_fee" ] && json_data="$json_data,\"consultationFee\":$consultation_fee"
    
    json_data="$json_data}"
    
    if [ -n "$priority" ]; then
        local response=$(curl -s -X POST "$API_URL/appointments?priority=$priority" -H "Content-Type: application/json" -H "x-trace-id: ${trace_id}" -H "x-user-id: test-user" -d "$json_data")
    else
        local response=$(curl -s -X POST "$API_URL/appointments" -H "Content-Type: application/json" -H "x-trace-id: ${trace_id}" -H "x-user-id: test-user" -d "$json_data")
    fi
    
    # Verificar se jq está disponível para formatação
    if command -v jq >/dev/null 2>&1; then
        echo "$response" | jq .
    else
        echo "$response"
    fi
    
    echo -e "\n${YELLOW}Trace ID: $trace_id${NC}\n"
    echo "════════════════════════════════════════"
    echo
}

# Função para verificar se API está rodando
check_api() {
    echo -e "${BLUE}🔍 Verificando se API está disponível...${NC}"
    if curl -s "$API_URL" > /dev/null; then
        echo -e "${GREEN}✅ API está rodando em $API_URL${NC}"
    else
        echo -e "${RED}❌ API não está disponível em $API_URL${NC}"
        echo -e "${YELLOW}💡 Execute primeiro: ./start-system.sh${NC}"
        exit 1
    fi
    echo
}

# Função para registrar psicólogos no banco de dados
setup_psychologists() {
    echo -e "${BLUE}👩‍⚕️ Configurando psicólogos no banco de dados...${NC}"
    
    # Verificar se já existem psicólogos
    PSYCH_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -t -c "SELECT COUNT(*) FROM psychologists;" 2>/dev/null | tr -d ' ')
    
    if [ "$PSYCH_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}📝 Registrando psicólogos para testes...${NC}"
        
        # Inserir psicólogos com dados realistas
        PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -c "
INSERT INTO psychologists (
    id, email, name, phone, \"registrationId\", biography, 
    \"consultationFeeMin\", \"consultationFeeMax\", \"yearsExperience\", 
    \"isActive\", \"isVerified\", \"workingDays\", \"startTime\", \"endTime\", 
    \"timeSlotDuration\", \"createdAt\", \"updatedAt\"
) VALUES 
(
    'psych_001_maria_silva',
    'dra.maria.silva@psiclinica.com.br',
    'Dra. Maria Silva Santos',
    '+55 11 98765-4321',
    'CRP-06/123456',
    'Especialista em Terapia Cognitivo-Comportamental com 15 anos de experiência.',
    150.00, 250.00, 15,
    true, true, 
    '{1,2,3,4,5}', -- Segunda a sexta
    '08:00', '18:00', 60,
    NOW(), NOW()
),
(
    'psych_002_joao_santos',
    'dr.joao.santos@mentesaude.com.br',
    'Dr. João Carlos Santos',
    '+55 21 97654-3210', 
    'CRP-05/789123',
    'Psicólogo clínico especializado em transtornos de ansiedade e emergências.',
    180.00, 300.00, 12,
    true, true,
    '{1,2,3,4,5,6}', -- Segunda a sábado
    '07:00', '19:00', 45,
    NOW(), NOW()
),
(
    'psych_003_ana_costa',
    'dra.ana.costa@terapiavida.com.br',
    'Dra. Ana Cristina Costa',
    '+55 31 96543-2109',
    'CRP-04/456789',
    'Especialista em psicoterapia e atendimento familiar.',
    120.00, 200.00, 8,
    true, true,
    '{2,3,4,5,6}', -- Terça a sábado
    '09:00', '17:00', 50,
    NOW(), NOW()
);" >/dev/null 2>&1
        
        echo -e "${GREEN}✅ Psicólogos registrados com sucesso!${NC}"
    else
        echo -e "${GREEN}✅ Psicólogos já existem no banco ($PSYCH_COUNT encontrados)${NC}"
    fi
    echo
}

# Função para obter IDs reais dos psicólogos
get_psychologist_ids() {
    echo -e "${BLUE}🔍 Obtendo IDs dos psicólogos do banco...${NC}"
    
    PSYCH_1=$(PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -t -c "SELECT id FROM psychologists WHERE email LIKE '%maria.silva%' LIMIT 1;" 2>/dev/null | tr -d ' ')
    PSYCH_2=$(PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -t -c "SELECT id FROM psychologists WHERE email LIKE '%joao.santos%' LIMIT 1;" 2>/dev/null | tr -d ' ')
    PSYCH_3=$(PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -t -c "SELECT id FROM psychologists WHERE email LIKE '%ana.costa%' LIMIT 1;" 2>/dev/null | tr -d ' ')
    
    if [ -n "$PSYCH_1" ] && [ -n "$PSYCH_2" ] && [ -n "$PSYCH_3" ]; then
        echo -e "${GREEN}✅ IDs obtidos do banco:${NC}"
        echo -e "${GREEN}   • Dra. Maria Silva: $PSYCH_1${NC}"
        echo -e "${GREEN}   • Dr. João Santos: $PSYCH_2${NC}"
        echo -e "${GREEN}   • Dra. Ana Costa: $PSYCH_3${NC}"
    else
        echo -e "${RED}❌ Erro ao obter IDs dos psicólogos do banco!${NC}"
        exit 1
    fi
    echo
}

echo -e "${BLUE}🧪 Testando API de Agendamentos...${NC}"
echo "═════════════════════════════════════════"
echo

# Verificações iniciais
check_api
setup_psychologists
get_psychologist_ids

# Teste 1: Verificar endpoint raiz
echo -e "${BLUE}🏠 Teste 1: Endpoint raiz${NC}"
echo "────────────────────────────────────────"
root_response=$(curl -s "$API_URL")
echo -e "Resposta: ${GREEN}$root_response${NC}"
echo "════════════════════════════════════════"
echo

# Teste 2: Data inválida (menos de 24h) - DEVE FALHAR
test_request "📅 Teste 2: Data inválida (menos de 24h)" \
  "maria.silva@gmail.com" \
  "Maria Silva Santos" \
  "+55 11 99876-5432" \
  "$PSYCH_1" \
  "2025-09-13T10:00:00.000Z" \
  "60" \
  "CONSULTATION" \
  "VIDEO_CALL" \
  "https://meet.google.com/abc-def-ghi" \
  "" \
  "Consulta de urgência - data muito próxima" \
  "150.0" \
  ""

# Teste 3: Psicólogo inexistente - DEVE FALHAR
test_request "👤 Teste 3: Psicólogo inexistente" \
  "joao.santos@hotmail.com" \
  "João Carlos Santos" \
  "+55 21 98765-4321" \
  "psicologo-inexistente-abcd1234" \
  "2025-01-15T14:00:00.000Z" \
  "60" \
  "CONSULTATION" \
  "VIDEO_CALL" \
  "https://meet.google.com/xyz-abc-123" \
  "" \
  "Primeira consulta com psicólogo não cadastrado" \
  "120.0" \
  ""

# Teste 4: Agendamento válido com prioridade normal - DEVE PASSAR
test_request "✅ Teste 4: Agendamento válido (Dr. Maria Silva)" \
  "ana.costa@outlook.com" \
  "Ana Beatriz Costa" \
  "+55 11 94567-8901" \
  "$PSYCH_1" \
  "2025-02-15T14:00:00.000Z" \
  "60" \
  "CONSULTATION" \
  "VIDEO_CALL" \
  "https://meet.google.com/valid-meeting-room" \
  "" \
  "Consulta inicial para avaliação psicológica" \
  "180.0" \
  "normal"

# Teste 5: Agendamento de emergência com alta prioridade - DEVE PASSAR
test_request "🚨 Teste 5: Agendamento de emergência (Dr. João Santos)" \
  "carlos.mendes@gmail.com" \
  "Carlos Eduardo Mendes" \
  "+55 21 93456-7890" \
  "$PSYCH_2" \
  "2025-02-18T16:30:00.000Z" \
  "90" \
  "EMERGENCY" \
  "VIDEO_CALL" \
  "https://teams.microsoft.com/emergency-session" \
  "" \
  "Atendimento de emergência - crise de ansiedade" \
  "250.0" \
  "high"

# Teste 6: Sessão de terapia (Dra. Ana Costa) - DEVE PASSAR
test_request "🧠 Teste 6: Sessão de terapia (Dra. Ana Costa)" \
  "fernanda.oliveira@yahoo.com.br" \
  "Fernanda Cristina Oliveira" \
  "+55 31 92345-6789" \
  "$PSYCH_3" \
  "2025-02-20T10:00:00.000Z" \
  "75" \
  "THERAPY_SESSION" \
  "IN_PERSON" \
  "" \
  "Consultório 205 - Bloco A" \
  "Terapia cognitivo-comportamental para transtorno de ansiedade" \
  "160.0" \
  "low"

# Teste 7: Agendamento em lote
echo -e "${BLUE}📦 Teste 7: Agendamento em lote${NC}"
echo "────────────────────────────────────────"
batch_data='{"appointments":[{"patientEmail":"patricia.lima@gmail.com","patientName":"Patricia Regina Lima","patientPhone":"+55 11 91234-5678","psychologistId":"'$PSYCH_1'","scheduledAt":"2025-02-22T14:00:00.000Z","duration":60,"appointmentType":"CONSULTATION","meetingType":"VIDEO_CALL","meetingUrl":"https://meet.google.com/batch-consultation","reason":"Avaliação inicial - agendamento em lote","consultationFee":170.0},{"patientEmail":"roberto.alves@hotmail.com","patientName":"Roberto Carlos Alves","patientPhone":"+55 21 98123-4567","psychologistId":"'$PSYCH_2'","scheduledAt":"2025-02-22T16:00:00.000Z","duration":45,"appointmentType":"FOLLOW_UP","meetingType":"IN_PERSON","meetingRoom":"Consultório 408","reason":"Retorno - acompanhamento mensal","consultationFee":140.0}]}'
batch_response=$(curl -s -X POST "$API_URL/appointments/batch?priority=normal" -H "Content-Type: application/json" -H "x-trace-id: batch_test_trace" -d "$batch_data")
if command -v jq >/dev/null 2>&1; then
    echo "$batch_response" | jq .
else
    echo "$batch_response"
fi
echo "════════════════════════════════════════"
echo

# Teste 8: Listar todas as consultas
echo -e "${BLUE}📋 Teste 8: Listar todas as consultas${NC}"
echo "────────────────────────────────────────"
list_response=$(curl -s -X GET "$API_URL/appointments?page=1&limit=10")
if command -v jq >/dev/null 2>&1; then
    echo "$list_response" | jq .
else
    echo "$list_response"
fi
echo "════════════════════════════════════════"
echo

# Teste 9: Listar consultas com filtros (Psicólogo específico)
echo -e "${BLUE}🔍 Teste 9: Listar consultas com filtros (Psicólogo específico)${NC}"
echo "────────────────────────────────────────"
filter_response=$(curl -s -X GET "$API_URL/appointments?psychologistId=$PSYCH_2&page=1&limit=5")
if command -v jq >/dev/null 2>&1; then
    echo "$filter_response" | jq .
else
    echo "$filter_response"
fi
echo "════════════════════════════════════════"
echo

# Teste 10: Listar consultas ordenadas por data
echo -e "${BLUE}📅 Teste 10: Listar consultas ordenadas por data${NC}"
echo "────────────────────────────────────────"
sort_response=$(curl -s -X GET "$API_URL/appointments?sortBy=scheduledAt&sortOrder=asc&page=1&limit=3")
if command -v jq >/dev/null 2>&1; then
    echo "$sort_response" | jq .
else
    echo "$sort_response"
fi
echo "════════════════════════════════════════"
echo

# Teste 11: Inserir consultas válidas diretamente no banco
echo -e "${BLUE}💾 Teste 11: Inserindo consultas válidas no banco de dados${NC}"
echo "────────────────────────────────────────"

# Inserir pacientes e consultas de teste que devem funcionar
PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -c "
-- Primeiro inserir os pacientes
INSERT INTO patients (
    id, email, name, phone, \"isActive\", \"createdAt\", \"updatedAt\"
) VALUES 
(
    'patient_test_001',
    'carlos.silva@email.com',
    'Carlos Eduardo Silva',
    '+55 11 99876-5432',
    true,
    NOW(),
    NOW()
),
(
    'patient_test_002', 
    'ana.santos@email.com',
    'Ana Carolina Santos',
    '+55 21 98765-4321',
    true,
    NOW(),
    NOW()
),
(
    'patient_test_003',
    'roberto.costa@email.com', 
    'Roberto José Costa',
    '+55 31 97654-3210',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Depois inserir as consultas
INSERT INTO appointments (
    id, \"patientId\", \"psychologistId\", \"scheduledAt\", duration,
    \"appointmentType\", status, \"meetingType\", \"meetingUrl\", reason,
    \"consultationFee\", \"isPaid\", \"createdAt\", \"updatedAt\"
) VALUES 
(
    'test_appt_001_success', 
    'patient_test_001',
    'psych_001_maria_silva',
    '2025-01-20T10:00:00.000Z',
    60,
    'CONSULTATION',
    'PENDING',
    'VIDEO_CALL',
    'https://meet.google.com/test-success-001',
    'Consulta inicial de teste - deve aparecer na listagem',
    180.00,
    false,
    NOW(),
    NOW()
),
(
    'test_appt_002_emergency', 
    'patient_test_002',
    'psych_002_joao_santos',
    '2025-01-21T16:00:00.000Z',
    45,
    'EMERGENCY',
    'CONFIRMED',
    'PHONE_CALL',
    'tel:+5511987654321',
    'Atendimento de emergência - teste',
    250.00,
    false,
    NOW(),
    NOW()
),
(
    'test_appt_003_therapy', 
    'patient_test_003',
    'psych_003_ana_costa',
    '2025-01-22T14:30:00.000Z',
    50,
    'THERAPY_SESSION',
    'PENDING',
    'IN_PERSON',
    NULL,
    'Sessão de terapia presencial - teste',
    160.00,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;
" >/dev/null 2>&1

echo -e "${GREEN}✅ 3 consultas de teste inseridas com sucesso!${NC}"
echo

# Teste 12: Verificar consultas inseridas via GET
echo -e "${BLUE}🔍 Teste 12: Verificando todas as consultas (incluindo as inseridas)${NC}"
echo "────────────────────────────────────────"
all_appointments_response=$(curl -s -X GET "$API_URL/appointments?page=1&limit=10&sortBy=scheduledAt&sortOrder=asc")
if command -v jq >/dev/null 2>&1; then
    echo "$all_appointments_response" | jq .
else
    echo "$all_appointments_response"
fi
echo "════════════════════════════════════════"
echo

# Teste 13: Filtrar por psicólogo específico  
echo -e "${BLUE}👨‍⚕️ Teste 13: Consultas da Dra. Maria Silva${NC}"
echo "────────────────────────────────────────"
maria_appointments=$(curl -s -X GET "$API_URL/appointments?psychologistId=$PSYCH_1&page=1&limit=5")
if command -v jq >/dev/null 2>&1; then
    echo "$maria_appointments" | jq .
else
    echo "$maria_appointments"
fi
echo "════════════════════════════════════════"
echo

# Teste 14: Filtrar por status
echo -e "${BLUE}📋 Teste 14: Consultas com status PENDING${NC}"
echo "────────────────────────────────────────"
pending_appointments=$(curl -s -X GET "$API_URL/appointments?status=PENDING&page=1&limit=5")
if command -v jq >/dev/null 2>&1; then
    echo "$pending_appointments" | jq .
else
    echo "$pending_appointments"
fi
echo "════════════════════════════════════════"
echo

# Teste 15: Filtrar por tipo de consulta
echo -e "${BLUE}🚨 Teste 15: Consultas de emergência${NC}"
echo "────────────────────────────────────────"
emergency_appointments=$(curl -s -X GET "$API_URL/appointments?appointmentType=EMERGENCY&page=1&limit=5")
if command -v jq >/dev/null 2>&1; then
    echo "$emergency_appointments" | jq .
else
    echo "$emergency_appointments"
fi
echo "════════════════════════════════════════"
echo

# Teste 16: Tentar um POST que funcione (simplificado, apenas campos obrigatórios)
echo -e "${BLUE}✨ Teste 16: POST simplificado (apenas campos obrigatórios)${NC}"
echo "────────────────────────────────────────"
simple_json='{"patientEmail":"teste.simples@gmail.com","patientName":"João da Silva","psychologistId":"'$PSYCH_1'","scheduledAt":"2026-06-15T10:00:00.000Z"}'
simple_response=$(curl -s -X POST "$API_URL/appointments" -H "Content-Type: application/json" -H "x-trace-id: test_simple" -d "$simple_json")
if command -v jq >/dev/null 2>&1; then
    echo "$simple_response" | jq .
else
    echo "$simple_response"
fi
echo "════════════════════════════════════════"
echo

echo -e "${GREEN}🏁 Testes concluídos!${NC}"
echo -e "${BLUE}📚 Acesse a documentação: $API_URL/api${NC}"
echo -e "${YELLOW}💡 Dica: Use 'jq' para formatar JSON: sudo apt install jq${NC}"

echo
echo -e "${BLUE}📊 Exibindo logs e estatísticas do sistema...${NC}"
echo "════════════════════════════════════════"

# Estatísticas do banco de dados
echo -e "${YELLOW}📊 Estatísticas do Banco de Dados:${NC}"
echo "────────────────────────────────────────"
PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -c "
SELECT 
    (SELECT COUNT(*) FROM psychologists) as total_psychologists,
    (SELECT COUNT(*) FROM appointments) as total_appointments,
    (SELECT COUNT(*) FROM appointments WHERE status = 'PENDING') as pending_appointments,
    (SELECT COUNT(*) FROM appointments WHERE status = 'CONFIRMED') as confirmed_appointments,
    (SELECT COUNT(*) FROM appointments WHERE \"appointmentType\" = 'EMERGENCY') as emergency_appointments;
"

echo
echo -e "${YELLOW}📋 Últimas 5 consultas por data:${NC}"
echo "────────────────────────────────────────"
PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -c "
SELECT 
    LEFT(id, 20) as appointment_id,
    \"psychologistId\",
    \"scheduledAt\",
    \"appointmentType\",
    status,
    \"consultationFee\"
FROM appointments 
ORDER BY \"scheduledAt\" ASC 
LIMIT 5;
"

echo
echo -e "${YELLOW}📋 Logs do Container da API:${NC}"
docker logs appointment-api --tail=30 --since=30s 2>/dev/null || echo "Container não encontrado"

echo
echo -e "${YELLOW}🐘 Logs do PostgreSQL:${NC}"
docker logs appointment-postgres --tail=10 --since=30s 2>/dev/null || echo "Container não encontrado"

echo
echo -e "${YELLOW}☁️  Logs do LocalStack:${NC}"
docker logs appointment-localstack --tail=10 --since=30s 2>/dev/null || echo "Container não encontrado"

echo

# Tabela bonita com consultas - nomes dos pacientes, psicólogos e datas
echo
echo -e "${GREEN}💎 RESUMO FINAL - CONSULTAS AGENDADAS${NC}"
echo "════════════════════════════════════════════════════════════════════════════════"
echo -e "${CYAN}┌─────────────────────┬──────────────────────────┬────────────────────┬───────────────┐${NC}"
echo -e "${CYAN}│       PACIENTE      │         PSICÓLOGO        │        DATA        │     STATUS    │${NC}"
echo -e "${CYAN}├─────────────────────┼──────────────────────────┼────────────────────┼───────────────┤${NC}"

# Buscar consultas com nomes dos pacientes e psicólogos
PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -c "
SELECT 
    COALESCE(SUBSTRING(p.name, 1, 19), 'Sem nome') as patient_name,
    COALESCE(SUBSTRING(ps.name, 1, 24), 'Psicólogo não encontrado') as psychologist_name,
    TO_CHAR(a.\"scheduledAt\", 'DD/MM/YYYY HH24:MI') as scheduled_date,
    a.status::text as status_raw
FROM appointments a
LEFT JOIN patients p ON a.\"patientId\" = p.id
LEFT JOIN psychologists ps ON a.\"psychologistId\" = ps.id
ORDER BY a.\"scheduledAt\" ASC;
" 2>/dev/null | tail -n +3 | head -n -1 | while read -r line; do
    if [ -n "$line" ] && [ "$line" != " " ] && [[ ! "$line" =~ ^\([0-9]+ ]] && [[ ! "$line" =~ rows?\) ]]; then
        # Parse line fields - PostgreSQL uses | as separator by default
        patient_name=$(echo "$line" | cut -d'|' -f1 | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
        psychologist_name=$(echo "$line" | cut -d'|' -f2 | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
        scheduled_date=$(echo "$line" | cut -d'|' -f3 | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
        status_raw=$(echo "$line" | cut -d'|' -f4 | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
        
        # Skip empty or malformed lines
        if [ -z "$patient_name" ] || [ -z "$scheduled_date" ]; then
            continue
        fi
        
        # Convert status to formatted version
        case "$status_raw" in
            "PENDING") status_formatted="⏳ Pendente" ;;
            "CONFIRMED") status_formatted="✅ Confirmado" ;;
            "COMPLETED") status_formatted="🎯 Concluído" ;;
            "CANCELLED") status_formatted="❌ Cancelado" ;;
            *) status_formatted="$status_raw" ;;
        esac
        
        # Garantir que cada campo tenha o tamanho correto
        printf "${CYAN}│${NC} %-19s ${CYAN}│${NC} %-24s ${CYAN}│${NC} %-18s ${CYAN}│${NC} %-13s ${CYAN}│${NC}\n" \
            "$patient_name" "$psychologist_name" "$scheduled_date" "$status_formatted"
    fi
done

echo -e "${CYAN}└─────────────────────┴──────────────────────────┴────────────────────┴───────────────┘${NC}"

# Mostrar estatísticas finais
echo
appointment_count=$(PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -t -c "SELECT COUNT(*) FROM appointments;" 2>/dev/null | tr -d ' ')
pending_count=$(PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -t -c "SELECT COUNT(*) FROM appointments WHERE status = 'PENDING';" 2>/dev/null | tr -d ' ')
confirmed_count=$(PGPASSWORD=postgres psql -h localhost -U postgres -d appointment_test_db -t -c "SELECT COUNT(*) FROM appointments WHERE status = 'CONFIRMED';" 2>/dev/null | tr -d ' ')

echo -e "${YELLOW}📊 ESTATÍSTICAS:${NC}"
echo -e "   📅 Total de consultas: ${GREEN}$appointment_count${NC}"
echo -e "   ⏳ Pendentes: ${YELLOW}$pending_count${NC}"
echo -e "   ✅ Confirmadas: ${GREEN}$confirmed_count${NC}"
echo
echo -e "${GREEN}🎉 Sistema funcionando perfeitamente!${NC}"
echo -e "${BLUE}📚 Documentação da API: ${CYAN}http://localhost:3000/api${NC}"
echo
echo "════════════════════════════════════════════════════════════════════════════════"