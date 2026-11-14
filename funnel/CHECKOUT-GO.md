# Checkout Cakto com e-mail + UTMs (checkout-go)

Sistema que captura **e-mail** na VSL, persiste **UTMs em cookie** e monta a URL da **Cakto** pré-preenchida antes do redirect.

Documentação oficial Cakto (parâmetros na URL):  
https://ajuda.cakto.com.br/pt-br/articles/61-como-pre-preencher-o-checkout-pela-url

---

## Fluxo resumido

```
Anúncio (UTMs na URL)
    → /dikads (ou /vsl no domínio 2)
        → checkout-go.js grava UTMs no cookie fcd_attr
        → Utmify (script separado) continua rodando na página
    → Usuário assiste a VSL
    → CTA aparece (cta.vsl.js + vsl-cta.json)
        → Clique no botão → modal de e-mail (cta-modal.css)
        → Enviar → /go/main?email=...&utm_...
    → /go/main/index.html
        → redirectOffer("main") lê checkout.json
        → Redirect para pay.cakto.com.br/...?email=...&confirmEmail=...&utm_...
```

Upsell: mesmo padrão com `/go/upsell` → oferta `upsell` em `checkout.json`.

---

## Arquivos novos

| Arquivo | Função |
|---------|--------|
| `public/funnel/checkout-go.js` | Cookies, montagem da URL Cakto, API `window.FcdCheckoutGo` |
| `public/funnel/cta-modal.css` | Estilos do popup de e-mail |
| `public/go/main/index.html` | Ponte: produto principal → Cakto |
| `public/go/upsell/index.html` | Ponte: upsell → Cakto |
| `public/funnel/CHECKOUT-GO.md` | Este documento |

## Arquivos alterados (relacionados)

| Arquivo | O que mudou |
|---------|-------------|
| `public/funnel/cta.vsl.js` | Abre modal no clique; envio chama `FcdCheckoutGo.goPathWithParams` |
| `public/funnel/vsl-cta.json` | `captureEmail`, textos do modal (`modalTitle`, etc.) |
| `public/dikads/index.html` | Script `checkout-go.js` |
| `public/up2diad/index.html` | Script `checkout-go.js` (UTMs no upsell) |
| `vercel.json` | `/go/main` e `/go/upsell` viram **rewrite** para HTML (não redirect direto à Cakto) |
| `scripts/apply-cakto-checkout.mjs` | Mantém rewrites `/go/*` ao rodar `npm run checkout:apply` |
| `scripts/build-github-pages.mjs` | Copia `public/go/` para `docs/go/` no projeto-divino2 |
| `member-area-src/CAKTO-SETUP.txt` | Nota sobre pré-preenchimento |

URLs Cakto continuam em `public/funnel/checkout.json` (`main.url`, `upsell.url`).

---

## Cookies e armazenamento

| Nome | Conteúdo | Validade |
|------|----------|----------|
| `fcd_attr` | JSON com UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`, `src`, `sck`, `xcod`) | 90 dias, `path=/`, `SameSite=Lax` |
| `fcd_lead_email` | E-mail em minúsculas | Cookie 90 dias + `localStorage` (fallback) |

Na primeira visita com UTMs na query string, os valores são **mesclados** no cookie. Visitas seguintes na mesma origem reutilizam o cookie mesmo se a URL não tiver mais UTMs (útil após ~28 min de VSL).

---

## API JavaScript (`window.FcdCheckoutGo`)

Carregado em `/dikads` e `/up2diad` antes do CTA.

| Método | Descrição |
|--------|-----------|
| `persistAttributionFromUrl()` | Lê query atual e atualiza `fcd_attr` |
| `getAttributionParams()` | Objeto com UTMs salvos |
| `setLeadEmail(email)` / `getLeadEmail()` | Grava/lê e-mail do lead |
| `isValidEmail(value)` | Validação simples |
| `buildCaktoUrl(baseUrl, extra)` | Monta URL Cakto com cookie + query |
| `goPathWithParams(path, email?)` | Usado pelo CTA → vai para `/go/main` com query |
| `redirectOffer("main" \| "upsell")` | Usado pelas páginas em `public/go/*` |

---

## Configuração do CTA (`vsl-cta.json`)

```json
{
  "goPath": "/go/main",
  "ctaDelaySeconds": 1719,
  "ctaLabel": "QUERO GARANTIR MINHA VAGA",
  "ctaSub": "Acesso imediato ao programa de 7 semanas",
  "captureEmail": true,
  "emailPlaceholder": "seu@email.com",
  "modalTitle": "Quase lá — reserve seu acesso",
  "modalSub": "Usamos seu e-mail apenas para liberar seu acesso ao programa.",
  "modalSubmitLabel": "Continuar para o checkout"
}
```

- **`captureEmail: false`** — clique vai direto para `/go/main` (UTMs ainda passam).
- **`goPath`** — normalmente `/go/main`; conta alternativa pode usar `/go/main2` se existir redirect no `vercel.json`.

Página alternativa: `data-fcd-cta-json="vsl-cta-alt.json"` no script `cta.vsl.js` (ex.: `/dikads2`).

---

## Vercel / deploy

**Site 1 (oracaodedeus):**

```bash
npm run deploy
```

**Domínio 2 (igrejaprojetodivino / projeto-divino2):**

```bash
npm run pages:build
npm run pages:push-divino2
```

O build copia `public/` (VSL → `/vsl/`, upsell → `/oferta/`), `go/`, `funnel/` (modal + checkout-go) para `docs/`.  
Redirects legados: `/dikads` → `/vsl/`, `/up2diad` → `/oferta/` (links antigos de anúncio).

---

## Como testar

1. Abrir:  
   `https://www.oracaodedeus.site/dikads?utm_source=tiktok&utm_campaign=teste&fcd_cta_now=1`  
   (`fcd_cta_now=1` exibe o CTA sem esperar o delay.)

2. Preencher e-mail e clicar no botão.

3. Na URL da Cakto, conferir parâmetros `email`, `confirmEmail` e `utm_*`.

4. DevTools → Application → Cookies → ver `fcd_attr` e `fcd_lead_email`.

---

## VTurb e links diretos

- Se o botão do **VTurb** apontar para `/go/main`, o fluxo passa pela ponte (UTMs do cookie + e-mail se já foi salvo).
- Link direto na Cakto **sem** passar por `/go/main` **não** recebe cookie automaticamente; use sempre `/go/main` ou `/go/upsell` no site.

---

## Limitações e notas

- O comprador **pode alterar** e-mail e dados na Cakto (comportamento da plataforma).
- Não substitui integração de **lista de e-mail** (Mailchimp, etc.) — apenas pré-preenche checkout.
- **Utmify** (`utmify-utms.js`) segue independente; o cookie é reforço para a URL da Cakto.
- **LGPD:** coleta de e-mail antes do pagamento exige base legal/política de privacidade conforme seu uso (remarketing, etc.).

---

## Referência rápida Cakto (query string)

Exemplo gerado pelo sistema:

```
https://pay.cakto.com.br/3a3yuez?email=cliente@email.com&confirmEmail=cliente@email.com&utm_source=tiktok&utm_campaign=...
```

Outros parâmetros suportados pela Cakto (não usados pelo site hoje, podem ser adicionados em `checkout-go.js`): `name`, `document`, `phone`, `coupon`.
