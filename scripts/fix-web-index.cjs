const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "dist", "index.html");

if (!fs.existsSync(filePath)) {
  console.error("dist/index.html nao encontrado.");
  process.exit(1);
}

let html = fs.readFileSync(filePath, "utf8");

html = html.replace(/<html[^>]*lang="en"[^>]*>/i, '<html lang="pt-BR" translate="no" class="notranslate">');

if (!/name="google"\s+content="notranslate"/i.test(html)) {
  html = html.replace(
    /<meta\s+name="viewport"[^>]*>/i,
    '$&\n    <meta name="google" content="notranslate" />\n    <meta name="translate" content="no" />\n    <meta httpEquiv="Content-Language" content="pt-BR" />'
  );
}

html = html.replace(/<body>/i, '<body class="notranslate">');
html = html.replace(
  /You need to enable JavaScript to run this app\./i,
  "Voce precisa habilitar o JavaScript para executar este app."
);

fs.writeFileSync(filePath, html, "utf8");
console.log("dist/index.html ajustado para pt-BR e notranslate.");
