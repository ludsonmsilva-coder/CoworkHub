# Checklist GO NO GO com Pontuacao (CoworkHub)

Data: ____/____/______
Responsavel: ____________________
Ambiente: ( ) Web Expo ( ) Android ( ) iOS
Build/Branch: ____________________

## Como usar
- Cada item vale 1 ponto.
- Marque:
  - [x] Passou
  - [!] Falhou
  - [ ] Nao testado

## Bloco A - Criticos (liberacao)
1. [ ] Login do operador funciona.
2. [ ] Navegacao entre abas sem crash.
3. [ ] Dashboard carrega KPIs sem erro.
4. [ ] Criar membro funciona.
5. [ ] Criar reserva valida funciona.
6. [ ] Bloqueio de conflito de reserva funciona.
7. [ ] Ajustes salvam no Supabase.

Subtotal A (0-7): ____

## Bloco B - Importantes (qualidade)
8. [ ] Filtros de membros funcionam.
9. [ ] Filtros de agenda por sala e membro funcionam.
10. [ ] Cancelamento de reserva por long press funciona.
11. [ ] Financeiro abre e lista faturas sem erro.
12. [ ] Acao "Marcar paga" funciona.
13. [ ] Validacao de URL da logo funciona.
14. [ ] Pull-to-refresh funciona em telas principais.

Subtotal B (0-7): ____

## Bloco C - Regressao visual e UX
15. [ ] Sem telas quebradas em resolucao mobile.
16. [ ] Sem textos truncados graves.
17. [ ] Feedbacks de erro/sucesso aparecem corretamente.
18. [ ] Tempo de resposta percebido aceitavel.
19. [ ] Nenhum redirecionamento inesperado de permissao.
20. [ ] Dados alterados refletem no Dashboard.

Subtotal C (0-6): ____

## Pontuacao final
Total = A + B + C = ____ / 20

## Regra de decisao automatica
- GO (liberar):
  - A >= 7
  - Total >= 17
- GO com ressalvas:
  - A >= 6
  - Total entre 14 e 16
- NO GO (nao liberar):
  - A <= 5
  - ou Total <= 13
  - ou qualquer crash em fluxo critico

## Pendencias abertas
1.
2.
3.

## Decisao final
- ( ) GO
- ( ) GO com ressalvas
- ( ) NO GO

Resumo executivo:
