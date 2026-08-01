# 08 — Integrações

## 1. AbacatePay (Pagamentos Pix)

### Por que AbacatePay no MVP
- Taxa fixa de R$0,80 por Pix recebido — custo previsível
- API simples, bem documentada, amigável para vibe coding (Cursor/Claude)
- Foco em Pix — suficiente para o MVP
- Sem burocracia de onboarding complexo

### Fluxo de integração

#### Gerar cobrança (link Pix)
```
POST https://api.abacatepay.com/v1/billing/create

Headers:
  Authorization: Bearer {API_KEY}
  Content-Type: application/json

Body:
{
  "frequency": "ONE_TIME",
  "methods": ["PIX"],
  "products": [
    {
      "externalId": "{cobranca_id}",  // nosso ID interno
      "name": "Mensalidade Junho 2026",
      "description": "Cobrança referente ao período 06/2026",
      "quantity": 1,
      "price": 15000  // em centavos: R$150,00 = 15000
    }
  ],
  "returnUrl": "https://athletto.com.br/pagamento/retorno",
  "completionUrl": "https://athletto.com.br/pagamento/concluido",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",  // opcional
    "taxId": "02692380266",     // CPF sem formatação
    "phone": "95984140592"      // opcional
  }
}

Resposta:
{
  "data": {
    "id": "bill_xxx",           // AbacatePay ID — salvar em cobranças.abacatepay_payment_id
    "url": "https://abacatepay.com/pay/bill_xxx",  // link para pagar
    "status": "PENDING"
  }
}
```

**O que salvar:**
```sql
UPDATE cobranças SET
  abacatepay_payment_id = 'bill_xxx',
  abacatepay_link = 'https://abacatepay.com/pay/bill_xxx'
WHERE id = '{cobranca_id}';
```

#### Receber webhook de confirmação
```
POST /webhooks/abacatepay

Headers (verificar):
  X-Webhook-Signature: {hmac_sha256}

Body:
{
  "event": "BILLING.PAID",
  "data": {
    "billing": {
      "id": "bill_xxx",
      "status": "PAID",
      "amount": 15000,
      "paidAt": "2026-05-13T15:30:00Z",
      "products": [
        {
          "externalId": "{cobranca_id}"  // nosso ID interno
        }
      ]
    }
  }
}
```

**Processamento do webhook:**
```typescript
// pseudo-código
async function handleAbacatepayWebhook(payload, signature) {
  // 1. Validar assinatura
  const expectedSig = hmacSha256(WEBHOOK_SECRET, JSON.stringify(payload));
  if (signature !== expectedSig) throw new Error('Invalid signature');

  // 2. Salvar no log (sempre, mesmo antes de processar)
  await db.webhook_logs.insert({ provider: 'abacatepay', evento: payload.event, payload });

  if (payload.event !== 'BILLING.PAID') return; // ignorar outros eventos

  // 3. Localizar cobrança pelo externalId
  const cobrancaId = payload.data.billing.products[0].externalId;
  const cobranca = await db.cobranças.findById(cobrancaId);
  if (!cobranca) throw new Error('Cobrança não encontrada');
  if (cobranca.status === 'pago') return; // idempotência — já processada

  // 4. Atualizar cobrança
  await db.cobranças.update(cobrancaId, {
    status: 'pago',
    data_pagamento: payload.data.billing.paidAt
  });

  // 5. Atualizar saldo da caixinha
  await db.caixinhas.incrementSaldo(cobranca.caixinha_id, cobranca.valor);

  // 6. Criar transação automática no dashboard
  await db.transacoes.insert({
    clube_id: cobranca.clube_id,
    tipo: 'entrada',
    valor: cobranca.valor,
    data: new Date(),
    cobranca_id: cobrancaId,
    caixinha_id: cobranca.caixinha_id,
    atleta_id: cobranca.atleta_id,
    descricao: `Pagamento automático via Pix`,
    origem: 'webhook'
  });

  // 7. Marcar webhook como processado
  await db.webhook_logs.markProcessed(logId);
}
```

### Variáveis de ambiente necessárias
```env
ABACATEPAY_API_KEY=your_api_key_here
ABACATEPAY_WEBHOOK_SECRET=your_webhook_secret_here
ABACATEPAY_BASE_URL=https://api.abacatepay.com/v1
```

---

## 2. WhatsApp Deep Link

### Como funciona
Sem API — sem custo — sem risco de banimento.

```
wa.me/55{DDD}{NUMERO}?text={MENSAGEM_ENCODED}
```

### Mensagem para cobrança pendente
```typescript
function gerarLinkWhatsApp(atleta, cobranca, caixinha) {
  const telefone = atleta.telefone_responsavel || atleta.telefone;
  const numero = telefone.replace(/\D/g, ''); // só dígitos

  const mensagem = `Oi ${atleta.nome}! 👋

A cobrança de *${caixinha.nome}* no valor de *R$ ${formatarValor(cobranca.valor)}* vence em *${formatarData(cobranca.data_vencimento)}*.

Segue o link para pagamento via Pix:
${cobranca.abacatepay_link}

Qualquer dúvida, estou à disposição! 🏆`;

  const mensagemEncoded = encodeURIComponent(mensagem);
  return `https://wa.me/55${numero}?text=${mensagemEncoded}`;
}
```

### Mensagem para alerta de evasão
```typescript
function gerarLinkEvasao(atleta) {
  const telefone = atleta.telefone_responsavel || atleta.telefone;
  const numero = telefone.replace(/\D/g, '');

  const mensagem = `Oi! 👋

Notamos que *${atleta.nome}* faltou às últimas aulas. Está tudo bem? Sentimos falta dele!

Se precisar conversar ou reorganizar os horários, me chama. Estamos aqui. 💙`;

  const mensagemEncoded = encodeURIComponent(mensagem);
  return `https://wa.me/55${numero}?text=${mensagemEncoded}`;
}
```

**No frontend:**
```html
<!-- O link abre o WhatsApp do gestor com a mensagem pronta -->
<a href="{link}" target="_blank" rel="noopener">
  <button>💬 Enviar cobrança</button>
</a>
```

---

## 3. ASAAS (Futuro — Plano Pro)

Quando o produto evoluir para o plano Pro, o ASAAS adiciona:
- **Boleto bancário** (para quem não tem Pix ou preferir)
- **Cartão de crédito** (parcelamento)
- **Régua de cobrança automática** — e-mail, SMS, WhatsApp automatizados
- **Subcontas** — possibilidade de split de pagamento no futuro

### Estratégia de migração
- AbacatePay e ASAAS coexistem no backend
- Clube no plano Básico/Intermediário → AbacatePay
- Clube no plano Pro → ASAAS (ou escolha do gestor)
- Interface não muda para o gestor — abstração no backend

---

## 4. Cron Jobs (Tarefas Agendadas)

### Alerta de Evasão
```
Frequência: Diária às 08:00 (horário de Brasília)
Timeout: 5 minutos

Lógica:
  Para cada clube ativo:
    Para cada atleta ativo:
      Para cada turma do atleta:
        frequencias_recentes = últimas 5 frequencias do atleta nessa turma
        se as 3 mais recentes são todas ausente = false:
          se não existe alerta ativo (não dispensado) para atleta+turma:
            criar alerta_evasao
```

### Cobranças Recorrentes
```
Frequência: Diária às 06:00 (horário de Brasília)
Timeout: 10 minutos

Lógica:
  Para cada caixinha ativa com planejamento recorrente:
    calcular próxima data de vencimento
    se hoje >= data_proximo_vencimento:
      se não existe cobrança pendente para este ciclo:
        gerar nova rodada de cobranças
        chamar AbacatePay para cada atleta vinculado
```

### Tecnologias para cron
- **Node.js:** `node-cron` ou `Bull` (com Redis para queue)
- **Outros:** AWS EventBridge, Render Cron Jobs, Railway Cron
