# Checklist QA - CoworkHub (Prompts 03 a 09)

Data: ____/____/______
Responsavel: ____________________
Ambiente: ( ) Web Expo ( ) Android ( ) iOS
Build/Branch: ____________________

## Legenda
- [ ] Nao testado
- [x] Aprovado
- [!] Reprovado

## 1) Login e Sessao
- [ ] Abrir app e entrar com conta de operador.
- [ ] App redireciona para abas do operador sem erro.
- [ ] Sair da conta e entrar novamente.
- [ ] Sessao persiste apos reabrir o app.

Observacoes:

## 2) Dashboard
- [ ] Exibe nome do espaco no topo.
- [ ] Exibe KPIs: membros ativos, reservas hoje, salas ativas, faturas pendentes.
- [ ] Pull-to-refresh funciona sem erro.
- [ ] Dados atualizam apos mudancas em membros/reservas/financeiro.

Observacoes:

## 3) Membros (Prompt 05)
- [ ] Criar membro com status ativo.
- [ ] Criar membro com status trial.
- [ ] Criar membro com status inadimplente.
- [ ] Busca por nome funciona.
- [ ] Busca por email funciona.
- [ ] Filtro por status funciona.
- [ ] Editar membro atualiza dados corretamente.
- [ ] Dashboard reflete alteracao de membros ativos.

Observacoes:

## 4) Salas e Reservas (Prompts 06 e 08)
### 4.1 Salas
- [ ] Criar ao menos 2 salas com cores diferentes.
- [ ] Editar sala (nome/tipo/capacidade/preco/cor).
- [ ] Status ativa/inativa exibido corretamente.

### 4.2 Agenda
- [ ] Criar reserva valida para hoje.
- [ ] Bloqueia conflito no mesmo horario/sala.
- [ ] Bloqueia com intervalo menor que 15 min (buffer).
- [ ] Bloqueia reserva fora de 07:00-21:00.
- [ ] Membros inativos/inadimplentes nao aparecem para reservar.
- [ ] Long press cancela reserva com confirmacao.

### 4.3 Filtros e ocupacao
- [ ] Filtro por sala funciona.
- [ ] Filtro por membro funciona.
- [ ] Painel de ocupacao por sala aparece e faz sentido.

Observacoes:

## 5) Financeiro (Prompt 07)
- [ ] Exibe KPIs: pendentes, atrasadas, pagas.
- [ ] Filtro de status (todas/pendentes/atrasadas/pagas) funciona.
- [ ] Lista mostra descricao, vencimento, valor e status.
- [ ] Acao "Marcar paga" funciona.
- [ ] Dashboard atualiza faturas pendentes apos pagamento.

Observacoes:

## 6) Ajustes do Espaco (Prompt 09)
- [ ] Alterar nome do espaco.
- [ ] Alterar fuso horario.
- [ ] Alterar moeda.
- [ ] Validacao de URL da logo funciona.
- [ ] Botao salvar habilita apenas quando ha mudancas.
- [ ] Botao descartar restaura valores atuais.
- [ ] Salvar persiste no Supabase.
- [ ] Reabrir app mantem configuracoes salvas.
- [ ] Dashboard reflete nome atualizado.

Observacoes:

## 7) Regressao rapida
- [ ] Navegacao entre abas sem travamentos.
- [ ] Nenhum erro visual grave em telas principais.
- [ ] Nenhum erro de permissao/redirect inesperado.
- [ ] Fluxo operador completo executa sem crash.

Observacoes:

## Resultado final
- ( ) Aprovado para uso
- ( ) Aprovado com ressalvas
- ( ) Reprovado

Resumo final:

Pendencias abertas:
1.
2.
3.
