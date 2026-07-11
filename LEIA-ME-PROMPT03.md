# Prompt 03 — Login, Cadastro e Onboarding ✓

## Como aplicar

1. Extraia este zip DENTRO da pasta do projeto (CoworkHub), substituindo
   os arquivos existentes quando perguntar (app/_layout.tsx e app/index.tsx
   serão atualizados).

2. IMPORTANTE — desative a confirmação de email no Supabase (só para
   desenvolvimento, senão você não consegue testar o cadastro):
   - Acesse https://supabase.com/dashboard
   - Projeto "coworkhub" -> Authentication -> Sign In / Providers
   - Em "Email", DESLIGUE a opção "Confirm email" e salve

3. Reinicie o servidor:
   npx expo start -c
   (aperte w para abrir no navegador)

## O que testar

1. Deve abrir a tela de boas-vindas do CoworkHub
2. Toque em "Criar conta" -> preencha nome, email e senha
3. Faça o onboarding em 3 passos (nome do espaço, fuso, moeda)
4. Deve cair na tela "Prompt 03 concluído ✓" mostrando o nome
   do seu espaço e "Operador"
5. Toque em "Sair da conta" e entre de novo pelo login

## Novos arquivos

- app/(auth)/ -> welcome, login, signup, onboarding
- app/home.tsx -> tela pós-login temporária (vira as abas no Prompt 04)
- src/hooks/useAuth.tsx -> sessão, espaço e papel (operador/membro)
- src/components/ui/ -> Button e Input reutilizáveis

## Observações

- Login com Google/Apple ficou para depois: exige configuração nativa
  que não funciona bem no navegador/Expo Go. Entra na fase do build.
- Se der erro "Invalid API key", confira o arquivo .env e reinicie
  com npx expo start -c
