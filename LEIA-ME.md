# CoworkHub Mobile — Prompt 01 concluído ✓

## Como colocar pra rodar no VS Code

1. Extraia TODO o conteúdo deste zip **dentro** da sua pasta `coworkhub`
   (os arquivos `package.json`, `app.json` etc. devem ficar na raiz da pasta).

2. Abra o terminal do VS Code (`Ctrl + '`) e rode, um de cada vez:

```
npm install
npx expo install --fix
```

O primeiro instala as dependências (demora alguns minutos).
O segundo ajusta as versões exatas compatíveis com o Expo — sempre rode ele.

3. Inicie o app:

```
npx expo start
```

4. Para ver no celular:
   - Instale o app **Expo Go** (Play Store / App Store)
   - Escaneie o QR Code que aparece no terminal
   - Celular e computador precisam estar no MESMO Wi-Fi

Se aparecer a tela "CoworkHub — Setup concluído", o Prompt 01 está pronto!

## Estrutura criada

```
coworkhub/
├── app/                  # telas/rotas (Expo Router)
│   ├── _layout.tsx       # layout raiz (React Query + Stack)
│   └── index.tsx         # tela inicial
├── src/
│   ├── components/       # (vazio — Prompt 04)
│   ├── hooks/            # (vazio — Prompt 03)
│   ├── lib/supabase.ts   # cliente Supabase configurado
│   ├── types/index.ts    # tipos TypeScript base
│   └── utils/            # (vazio)
├── supabase/migrations/  # SQL do banco (Prompt 02)
├── assets/               # ícone e splash (adicionar depois)
├── .env.example          # modelo das variáveis
└── configs (app.json, tailwind, babel, metro, tsconfig)
```

## Antes do Prompt 03 (login)

Copie `.env.example` para `.env` e preencha com as chaves do seu projeto
Supabase (Painel → Project Settings → API). Sem isso o login não funciona —
mas para o Prompt 01 e 02 não precisa.

## Problemas comuns

- **"node não é reconhecido"** → instale o Node.js LTS em nodejs.org e reinicie o VS Code
- **Erro de cache do Metro** → rode `npx expo start -c`
- **QR Code não conecta** → verifique se estão no mesmo Wi-Fi, ou rode `npx expo start --tunnel`
