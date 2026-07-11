# Prompt 08 — Melhorias de Reservas e Agenda

## Status
Aplicado neste projeto.

## O que chegou
- Filtros de agenda por sala e por membro
- Painel de ocupação das salas no dia selecionado (percentual + horas)
- Validação de horário operacional no backend de reservas (07:00-21:00)
- Intervalo de segurança (buffer) de 15 minutos entre reservas da mesma sala
- Mensagens de erro mais claras para conflito e horário inválido
- Modal com horários de início dinâmicos conforme duração

## Arquivos principais
- app/(operator)/bookings.tsx
- src/components/bookings/BookingFormModal.tsx
- src/hooks/useBookings.ts

## O que testar
1. Criar reservas sequenciais e com sobreposição
2. Tentar encaixe com menos de 15 min entre reservas na mesma sala (deve bloquear)
3. Tentar reserva que termine após 21:00 (deve bloquear)
4. Filtrar agenda por sala e por membro
5. Conferir painel de ocupação por sala no dia
6. Confirmar atualização dos KPIs do Dashboard
