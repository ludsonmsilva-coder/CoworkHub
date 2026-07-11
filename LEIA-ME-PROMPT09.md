# Prompt 09 — Ajustes Avançados do Espaço

## Status
Aplicado neste projeto.

## O que chegou
- Formulário editável na aba Ajustes
- Atualização com persistência no Supabase de:
  - nome do espaço
  - fuso horário
  - moeda
  - logo (URL)
- Validação de campos (nome e URL da logo)
- Feedback de sucesso/erro no salvamento
- Botões para salvar e descartar alterações

## Arquivos principais
- app/(operator)/settings.tsx
- src/hooks/useSpaceSettings.ts

## O que testar
1. Alterar dados do espaço na aba Ajustes
2. Salvar e reabrir o app
3. Confirmar persistência dos dados
4. Validar reflexo dos dados no Dashboard
