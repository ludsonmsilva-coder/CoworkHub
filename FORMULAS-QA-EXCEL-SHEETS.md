# Formulas automaticas - QA GO/NO GO

Arquivo base: HISTORICO-QA-ITENS-STATUS.csv

## Mapeamento de colunas
- E:K = Bloco A (A1..A7)
- L:R = Bloco B (B8..B14)
- S:X = Bloco C (C15..C20)
- Y = bloco_a_criticos
- Z = bloco_b_qualidade
- AA = bloco_c_regressao
- AB = total_20
- AC = decisao
- AD = crash_critico

## Formulas para Google Sheets / Excel em ingles
Cole na linha 2 (primeira linha de dados) e arraste para baixo.

- Y2
=COUNTIF(E2:K2,"PASSOU")

- Z2
=COUNTIF(L2:R2,"PASSOU")

- AA2
=COUNTIF(S2:X2,"PASSOU")

- AB2
=Y2+Z2+AA2

- AC2
=IF(OR(AD2="sim",Y2<=5,AB2<=13),"NO GO",IF(AND(Y2>=7,AB2>=17),"GO",IF(AND(Y2>=6,AB2>=14,AB2<=16),"GO COM RESSALVAS","NO GO")))

## Formulas para Excel em pt-BR
Se seu Excel estiver em portugues, use esta versao com ponto e virgula.

- Y2
=CONT.SE(E2:K2;"PASSOU")

- Z2
=CONT.SE(L2:R2;"PASSOU")

- AA2
=CONT.SE(S2:X2;"PASSOU")

- AB2
=Y2+Z2+AA2

- AC2
=SE(OU(AD2="sim";Y2<=5;AB2<=13);"NO GO";SE(E(Y2>=7;AB2>=17);"GO";SE(E(Y2>=6;AB2>=14;AB2<=16);"GO COM RESSALVAS";"NO GO")))

## Regra aplicada
- GO: A >= 7 e Total >= 17
- GO COM RESSALVAS: A >= 6 e Total entre 14 e 16
- NO GO: A <= 5 ou Total <= 13 ou crash critico
