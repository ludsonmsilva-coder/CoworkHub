# Prompt 04 — Navegação com Abas ✓

## Como aplicar

1. Extraia este zip DENTRO da pasta CoworkHub, substituindo arquivos
   quando perguntar (index.tsx e home.tsx foram atualizados).
2. Reinicie: Ctrl+C e depois `npx expo start -c`, aperte `w`.

## O que mudou

- Operador agora tem 5 abas: Dashboard, Membros, Reservas,
  Financeiro e Ajustes
- Dashboard já mostra KPIs REAIS do banco (membros ativos, reservas
  de hoje, salas ativas, faturas pendentes) com puxar-para-atualizar
- Ajustes mostra os dados do espaço e tem o botão de sair
- Membros do coworking (quando existirem) terão as abas: Início,
  Reservar, Minhas Reservas e Perfil

## O que testar

1. Ao entrar, deve cair direto no Dashboard com os 4 cards (tudo 0
   por enquanto — normal, o banco está vazio)
2. Navegue pelas 5 abas
3. Em Ajustes, confira os dados do espaço e teste sair/entrar
