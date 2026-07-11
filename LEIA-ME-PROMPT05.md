# Prompt 05 — Módulo de Membros ✓

## Como aplicar

1. Extraia este zip DENTRO da pasta CoworkHub, substituindo arquivos.
2. Reinicie: Ctrl+C -> `npx expo start -c` -> aperte `w`.

## O que chegou

- Aba Membros totalmente funcional:
  - Busca em tempo real por nome ou email
  - Filtros por status (Todos / Ativos / Trial / Inadimplentes / Inativos)
  - Cartões com avatar de iniciais e badge colorido de status
  - Botão + flutuante para adicionar membro
  - Tocar em um membro abre a edição
  - Validação de email e aviso de email duplicado
- O Dashboard atualiza sozinho o card "Membros ativos"

## O que testar

1. Adicione 2 ou 3 membros com status diferentes
2. Use a busca e os filtros
3. Edite um membro (mude o status, por exemplo)
4. Volte ao Dashboard: "Membros ativos" deve refletir a mudança
