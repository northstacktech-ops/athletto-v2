# 01 — Visão do Produto

## Problema que resolvemos

O gestor de uma escolinha ou clube esportivo de até 300 atletas é o "faz tudo":
- Treina
- Cobra mensalidade manualmente (WhatsApp, papel, caderno)
- Controla frequência em planilha ou caderno
- Organiza viagens e competições
- Atende o pai às 22h no WhatsApp

Sistemas grandes (como os usados por clubes profissionais) são caros e complexos demais. O caderninho é ineficiente e não escala. O Athletto preenche esse gap.

---

## Proposta de Valor

> **"O sistema que economiza 4 horas de burocracia por semana para o gestor esportivo."**

O Athletto não é só um banco de dados de atletas. É um **assistente proativo** que:
- Alerta sobre atletas em risco de evasão antes que eles saiam
- Gera cobranças automáticas e envia por WhatsApp em um clique
- Separa cada iniciativa financeira em sua própria "caixinha"
- Centraliza tudo que o gestor precisa em um só lugar

---

## Público-Alvo

### Persona principal: O Gestor Esportivo
- Treinador ou responsável administrativo de clube/escola esportiva
- Gerencia entre 20 e 300 atletas
- Modalidades: futebol, futsal, flag football, natação, tênis, basquete, vôlei, ciclismo, jiu-jitsu, outros
- Perfil tecnológico: intermediário — usa WhatsApp, Instagram, Google Sheets
- Principal dor: tempo perdido com cobrança e controle manual

### Persona secundária: O Pai/Responsável
- Acessa o app Flutter do atleta
- Quer ver cobranças pendentes e pagar sem fricção
- Quer acompanhar a frequência do filho
- Não quer instalar "mais um app complicado"

---

## Posicionamento

| | Athletto | Planilha/Caderno | Sistemas Enterprise |
|---|---|---|---|
| Custo | Baixo (R$49–199/mês) | Grátis | Alto (R$500+/mês) |
| Complexidade | Simples | Simples | Alta |
| Cobrança automática | ✅ | ❌ | ✅ |
| Alerta de evasão | ✅ | ❌ | Às vezes |
| App para atleta | ✅ | ❌ | Às vezes |
| Self-service | ✅ | ✅ | ❌ |

---

## Princípios de Produto

1. **Self-service total** — O gestor entra, configura e usa. Menos suporte = mais margem.
2. **Automação onde importa** — Cobrança, confirmação de pagamento e alertas são automáticos. O gestor só age onde precisa de julgamento humano.
3. **WhatsApp como canal, não como problema** — Deep link resolve comunicação sem risco de ban e sem custo de API.
4. **Dados que geram decisão** — Todo dado coletado (frequência, pagamento, saúde) precisa virar insight acionável para o gestor.
5. **Modular e evolutivo** — MVP enxuto, mas arquitetura pronta para crescer.

---

## Planos e Preços (atual)

| Plano | Preço | Atletas | Turmas | Competições |
|---|---|---|---|---|
| Básico | R$49,90/mês | Até 40 | 5 | — |
| Intermediário | R$99,90/mês | Até 80 | 20 | 30 |
| Profissional | R$199,90/mês | Ilimitado | 20 | 20 |

> ⚠️ **Ponto de revisão:** O plano Pro com atletas ilimitados mas apenas 20 competições pode gerar atrito em clubes maiores. Avaliar os limites do Pro antes do lançamento.
