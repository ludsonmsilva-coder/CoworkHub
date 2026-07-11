# Prompt 07 — Financeiro Básico ✓

## Status
Aplicado neste projeto.

## O que chegou
- Tela Financeiro funcional (sem placeholder)
- KPIs de faturas: Pendentes, Atrasadas e Pagas
- Filtro por status (Todas, Pendentes, Atrasadas, Pagas)
- Lista de faturas com:
  - descrição
  - vencimento
  - valor formatado
  - badge de status
- Ação para marcar fatura como paga
- Atualização automática de cache no Dashboard

## Arquivos principais
- app/(operator)/finance.tsx
- src/hooks/useInvoices.ts
- src/types/index.ts

## O que testar
1. Abrir a aba Financeiro
2. Validar os cards de KPI
3. Trocar os filtros e conferir a lista
4. Marcar uma fatura pendente como paga
5. Voltar ao Dashboard e conferir atualização

## Observações
- Esta etapa cobre o financeiro operacional básico.
- Integração com gateway de pagamento e métricas avançadas entra nos próximos passos.
