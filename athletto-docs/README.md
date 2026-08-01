# Athletto — Documentação do MVP

> Sistema de gestão esportiva para clubes e times. SaaS B2B focado em gestores de equipes amadoras e semiprofissionais no Brasil.

---

## Índice

1. [Visão do Produto](./01-visao-produto.md)
2. [Arquitetura do Sistema](./02-arquitetura.md)
3. [Módulos do MVP](./03-modulos.md)
4. [Modelo de Dados](./04-modelo-dados.md)
5. [Fluxos Principais](./05-fluxos.md)
6. [Financeiro — Detalhamento](./06-financeiro.md)
7. [App Flutter — Portal do Atleta](./07-app-flutter.md)
8. [Integrações](./08-integracoes.md)
9. [Regras de Negócio](./09-regras-negocio.md)
10. [Roadmap Pós-MVP](./10-roadmap.md)

---

## Resumo Executivo

O Athletto é um SaaS de gestão esportiva que resolve a dor do gestor "faz tudo" — aquele que treina, cobra, organiza e ainda atende o pai no WhatsApp às 22h.

### Stack definida
- **Frontend web (gestor):** a definir pelo time
- **App mobile (atleta/pai):** Flutter — iOS + Android
- **Pagamentos MVP:** AbacatePay (Pix)
- **Pagamentos Pro (futuro):** ASAAS (Pix + Boleto + Cartão)
- **Comunicação:** Deep link WhatsApp (sem API, sem risco de ban)

### Módulos do MVP
| Módulo | Status |
|---|---|
| Atletas | ✅ MVP |
| Turmas | ✅ MVP |
| Frequência | ✅ MVP |
| Calendário | ✅ MVP |
| Financeiro (remodulado) | ✅ MVP |
| Competições | ⏳ Pós-MVP |
| Equipe | ⏳ Pós-MVP |
| Academia | ⏳ Pós-MVP |

### Plataformas
| Plataforma | Usuário | Status |
|---|---|---|
| Web app (painel) | Gestor / Treinador | MVP |
| App Flutter | Atleta / Pai | Fase seguinte |
