<template>
  <div class="min-h-screen bg-gray-50 dark:bg-surface-canvas-dark py-12 px-4">
    <article class="max-w-3xl mx-auto bg-white dark:bg-surface-elevated-dark rounded-2xl border border-gray-200 dark:border-white/[0.10] p-8 sm:p-10">

      <div class="mb-6">
        <NuxtLink to="/" class="text-xs font-semibold text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </NuxtLink>
      </div>

      <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white">Termos de Uso</h1>
      <p class="text-xs text-gray-400 mt-1">Última atualização: {{ dataAtualizacao }}</p>

      <div class="mt-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-5">
        <p>
          Ao criar uma conta no <strong>Athletto</strong> você concorda com estes
          termos. Leia com atenção — eles definem direitos e obrigações tanto
          seus quanto nossos.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">1. O serviço</h2>
        <p>
          O Athletto é uma plataforma SaaS para gestão de clubes e escolinhas
          esportivas — incluindo cadastro de atletas e turmas, registro de
          frequência, alertas de evasão, gestão financeira e cobranças via Pix.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">2. Cadastro e responsabilidade</h2>
        <ul class="list-disc pl-5 space-y-1">
          <li>Você se compromete a fornecer informações verdadeiras e atualizadas.</li>
          <li>É responsável por manter suas credenciais em sigilo.</li>
          <li>Como gestor, você responde pelos dados dos atletas que cadastra — tendo a base legal (consentimento dos responsáveis quando aplicável).</li>
        </ul>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">3. Planos e cobrança</h2>
        <ul class="list-disc pl-5 space-y-1">
          <li>Oferecemos 30 dias de trial gratuito sem necessidade de cartão.</li>
          <li>Ao término do trial, o serviço é cobrado mensalmente via Pix.</li>
          <li>O não pagamento por mais de 10 dias suspende o acesso. Após 90 dias, a conta é anonimizada.</li>
          <li>Cancelamento pode ser feito a qualquer momento — sem multa.</li>
        </ul>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">4. Uso aceitável</h2>
        <p>Você concorda em <strong>NÃO</strong>:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Usar o sistema para atividades ilegais.</li>
          <li>Cadastrar dados de terceiros sem autorização.</li>
          <li>Tentar acessar áreas restritas ou dados de outros clubes.</li>
          <li>Fazer scraping ou engenharia reversa.</li>
        </ul>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">5. Propriedade dos dados</h2>
        <p>
          Os dados que você insere são <strong>seus</strong>. Você pode exportá-los
          em CSV a qualquer momento. Nós atuamos como operadores de dados sob a
          LGPD.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">6. Limitação de responsabilidade</h2>
        <p>
          O Athletto é fornecido "como está". Não nos responsabilizamos por
          decisões tomadas com base nos relatórios do sistema. Garantimos
          disponibilidade de 99,5% mensal — abaixo disso, oferecemos crédito
          proporcional automaticamente.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">7. Alterações</h2>
        <p>
          Podemos alterar estes termos com aviso prévio de 30 dias por e-mail.
          Continuar usando após esse prazo significa aceitação dos novos termos.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">8. Foro</h2>
        <p>
          Fica eleito o foro da comarca de Curitiba — PR para dirimir qualquer
          disputa, com renúncia de qualquer outro por mais privilegiado que seja.
        </p>

        <p class="text-xs text-gray-400 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
          Contato: <strong>contato@athletto.com.br</strong>
        </p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Termos de Uso — Athletto' })
const dataAtualizacao = '15 de maio de 2026'
</script>
