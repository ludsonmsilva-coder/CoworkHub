# Prompt 06 — Salas e Reservas ✓

## Como aplicar
1. Extraia o zip DENTRO da pasta CoworkHub, substituindo arquivos.
2. Ctrl+C -> `npx expo start -c` -> `w`.

## O que chegou
- Aba Reservas com dois modos: Agenda e Salas
- Salas: criar/editar com tipo, capacidade, preço/hora e cor (8 opções)
- Agenda: faixa de 14 dias, reservas do dia com faixa colorida da sala
- Nova reserva: escolher sala, membro, horário (07:00–21:00) e duração
- Validação de conflito: não deixa reservar sala já ocupada no horário
- Membros inadimplentes/inativos não aparecem para reservar
- Segurar o dedo (long press) numa reserva = cancelar
- Dashboard atualiza "Reservas hoje" e "Salas ativas"

## O que testar
1. Na aba Salas, crie 2 salas com cores diferentes
2. Na Agenda, crie uma reserva para hoje com um dos seus membros
3. Tente criar OUTRA reserva na mesma sala e horário -> deve bloquear
4. Segure numa reserva para cancelar
5. Veja o Dashboard atualizar
