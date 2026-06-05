<template>
  <div class="min-h-screen bg-gray-50 dark:bg-surface-canvas-dark py-12 px-4">
    <article class="max-w-3xl mx-auto bg-white dark:bg-surface-elevated-dark rounded-2xl border border-gray-200 dark:border-white/[0.10] p-8 sm:p-10">

      <div class="mb-6">
        <NuxtLink to="/" class="text-xs font-semibold text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </NuxtLink>
      </div>

      <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white">Política de Privacidade</h1>
      <p class="text-xs text-gray-400 mt-1">Última atualização: {{ dataAtualizacao }}</p>

      <div class="prose-content mt-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-5">
        <p>
          Esta política descreve como a <strong>Athletto</strong> coleta, usa, armazena e
          protege os dados pessoais dos clubes, gestores, atletas e responsáveis
          que utilizam nossa plataforma. Seguimos integralmente a Lei Geral de
          Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">1. Dados que coletamos</h2>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Do gestor:</strong> nome, CPF, e-mail, telefone, foto opcional.</li>
          <li><strong>Do clube:</strong> nome, CNPJ, modalidade, endereço, logo.</li>
          <li><strong>Dos atletas:</strong> nome, CPF, data de nascimento, posição, foto opcional, histórico de lesões, observações médicas, status de saúde.</li>
          <li><strong>Do responsável:</strong> telefone para contato.</li>
          <li><strong>Financeiros:</strong> valores, datas e histórico de pagamentos. Não armazenamos dados de cartão — pagamentos via Pix são processados pelo AbacatePay.</li>
          <li><strong>Operacionais:</strong> frequência, eventos do calendário, mensagens internas.</li>
        </ul>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">2. Por que coletamos</h2>
        <p>Usamos esses dados exclusivamente para:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Operar as funcionalidades do sistema (cadastro, frequência, cobrança).</li>
          <li>Gerar relatórios e indicadores para a gestão do clube.</li>
          <li>Cumprir obrigações legais e fiscais.</li>
          <li>Manter a segurança e integridade da plataforma.</li>
        </ul>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">3. Compartilhamento</h2>
        <p>
          Nunca vendemos ou cedemos dados a terceiros para fins comerciais.
          Compartilhamos apenas com operadores essenciais (AbacatePay para Pix,
          Supabase para banco de dados, Cloudflare para infraestrutura), todos
          sob acordo de processamento conforme a LGPD.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">4. Seus direitos</h2>
        <p>Você (titular dos dados) tem direito a:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Acessar todos os dados que mantemos sobre você.</li>
          <li>Corrigir dados incompletos ou desatualizados.</li>
          <li>Solicitar exclusão (anonimização após retenção legal).</li>
          <li>Solicitar exportação em formato CSV.</li>
          <li>Revogar consentimento a qualquer momento.</li>
        </ul>
        <p>Para exercer qualquer direito, escreva para <strong>privacidade@athletto.com.br</strong>.</p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">5. Retenção</h2>
        <p>
          Dados ativos ficam armazenados enquanto a conta estiver ativa. Após
          cancelamento, mantemos por 90 dias para permitir reativação, e depois
          anonimizamos os campos pessoais (mantendo apenas registros agregados
          para obrigações fiscais).
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">6. Segurança</h2>
        <p>
          Aplicamos criptografia em trânsito (TLS), criptografia em repouso no
          banco, autenticação de dois fatores opcional, isolamento por clube
          via Row Level Security e backups diários.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">7. Encarregado (DPO)</h2>
        <p>
          Em caso de dúvidas, contate nosso encarregado de proteção de dados
          em <strong>dpo@athletto.com.br</strong>.
        </p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Privacidade — Athletto' })
const dataAtualizacao = '15 de maio de 2026'
</script>
