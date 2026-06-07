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
          Esta Política de Privacidade descreve como a <strong>Athletto</strong> coleta,
          usa, armazena, compartilha e protege os dados pessoais de clubes, gestores,
          atletas e responsáveis que utilizam nossa plataforma. Seguimos integralmente
          a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">1. Identificação do controlador</h2>
        <p>
          O controlador dos dados pessoais tratados nesta plataforma é:
        </p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Razão social:</strong> [RAZÃO SOCIAL]</li>
          <li><strong>CNPJ:</strong> [CNPJ]</li>
          <li><strong>Endereço:</strong> [ENDEREÇO]</li>
          <li><strong>Nome comercial:</strong> Athletto</li>
          <li><strong>Contato:</strong> <strong>athletto.empresa@gmail.com</strong></li>
        </ul>
        <p>
          Observação sobre papéis na LGPD: em relação aos dados que o gestor cadastra
          sobre seus atletas, o clube/gestor atua como <strong>controlador</strong> desses
          dados e a Athletto atua como <strong>operadora</strong>, tratando-os conforme as
          instruções do clube e os limites desta política.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">2. Dados coletados e finalidade</h2>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Do gestor:</strong> nome, CPF, e-mail, telefone e foto opcional — para autenticação, contato e emissão de comprovantes.</li>
          <li><strong>Do clube:</strong> nome, CNPJ, modalidade, endereço e logo — para identificação e operação da conta.</li>
          <li><strong>Dos atletas:</strong> nome, CPF, data de nascimento, posição, número da camisa, foto opcional, histórico de lesões, observações médicas e status de saúde — para gestão esportiva, frequência e segurança do atleta.</li>
          <li><strong>Do responsável:</strong> nome e telefone de contato — para comunicação sobre cobranças, frequência e avisos do clube.</li>
          <li><strong>Financeiros:</strong> valores, datas e histórico de pagamentos — para gestão de mensalidades e cobranças. <strong>Não armazenamos dados de cartão</strong>; pagamentos via Pix são processados pela AbacatePay.</li>
          <li><strong>Operacionais:</strong> frequência, eventos do calendário, mensagens internas e notificações — para o funcionamento das funcionalidades.</li>
          <li><strong>Técnicos:</strong> registros de acesso (logs), endereço IP e identificadores de sessão — para segurança e prevenção a fraudes.</li>
        </ul>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">3. Base legal</h2>
        <p>O tratamento dos dados se apoia nas seguintes bases legais da LGPD (art. 7º e art. 11):</p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Execução de contrato</strong> (art. 7º, V): operação das funcionalidades contratadas pelo clube.</li>
          <li><strong>Cumprimento de obrigação legal/regulatória</strong> (art. 7º, II): obrigações fiscais e contábeis.</li>
          <li><strong>Legítimo interesse</strong> (art. 7º, IX): segurança da plataforma, prevenção a fraudes e melhoria do serviço.</li>
          <li><strong>Consentimento</strong> (art. 7º, I e art. 11, I): para dados sensíveis de saúde do atleta (histórico de lesões, observações médicas, tipo sanguíneo), coletados pelo clube mediante autorização do titular ou de seu responsável legal.</li>
        </ul>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">4. Compartilhamento de dados</h2>
        <p>
          Nunca vendemos ou cedemos dados a terceiros para fins comerciais.
          Compartilhamos dados apenas com operadores essenciais à prestação do
          serviço, todos sob contrato de tratamento de dados conforme a LGPD:
        </p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Supabase:</strong> banco de dados, autenticação e armazenamento de arquivos (fotos/logos).</li>
          <li><strong>AbacatePay:</strong> processamento de pagamentos via Pix.</li>
          <li><strong>Vercel:</strong> hospedagem e infraestrutura de execução da aplicação.</li>
        </ul>
        <p>
          Eventuais transferências internacionais de dados ocorrem somente com
          provedores que adotem garantias adequadas de proteção, nos termos do
          art. 33 da LGPD.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">5. Retenção dos dados</h2>
        <p>
          Os dados ativos são armazenados enquanto a conta estiver ativa. Após o
          cancelamento, mantemos os dados por 90 dias para permitir reativação;
          decorrido esse prazo, os campos pessoais são anonimizados, preservando-se
          apenas registros agregados e os necessários ao cumprimento de obrigações
          legais e fiscais, pelos prazos exigidos em lei.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">6. Direitos do titular</h2>
        <p>Nos termos do art. 18 da LGPD, você (titular dos dados) tem direito a:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Acesso:</strong> confirmar a existência de tratamento e acessar os dados que mantemos sobre você.</li>
          <li><strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados.</li>
          <li><strong>Exclusão/anonimização:</strong> solicitar a eliminação ou anonimização dos dados, respeitadas as retenções legais.</li>
          <li><strong>Portabilidade:</strong> solicitar a exportação dos seus dados em formato estruturado (CSV).</li>
          <li><strong>Revogação de consentimento:</strong> revogar, a qualquer momento, o consentimento dado para tratamentos baseados nessa hipótese.</li>
          <li><strong>Informação:</strong> saber com quais entidades seus dados são compartilhados e oporse a tratamentos.</li>
        </ul>
        <p>
          Para exercer qualquer um desses direitos, escreva para
          <strong>athletto.empresa@gmail.com</strong>. Responderemos no menor prazo possível,
          observados os limites legais.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">7. Segurança da informação</h2>
        <p>
          Adotamos medidas técnicas e administrativas para proteger os dados,
          incluindo criptografia em trânsito (TLS), criptografia em repouso no banco,
          isolamento entre clubes via Row Level Security (RLS), controle de acesso por
          autenticação e backups periódicos. Em caso de incidente de segurança que
          possa acarretar risco relevante aos titulares, comunicaremos os afetados e a
          ANPD conforme exigido pela LGPD.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">8. Dados de menores de idade</h2>
        <p>
          A plataforma trata dados de atletas que podem ser crianças ou adolescentes.
          Esses dados são fornecidos pelo clube/gestor, que declara possuir o
          consentimento específico e em destaque dado por pelo menos um dos pais ou
          responsável legal, no melhor interesse do menor, nos termos do art. 14 da
          LGPD. A Athletto não coleta dados de menores diretamente sem essa
          intermediação.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">9. Cookies e tecnologias semelhantes</h2>
        <p>
          Utilizamos cookies e armazenamento local estritamente necessários ao
          funcionamento da plataforma (sessão de login, preferências de interface).
          Não utilizamos cookies de publicidade de terceiros. Você pode gerenciar
          cookies nas configurações do seu navegador, ciente de que desabilitá-los
          pode afetar o funcionamento do serviço.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">10. Alterações nesta política</h2>
        <p>
          Esta política pode ser atualizada periodicamente. Alterações relevantes
          serão comunicadas por e-mail e/ou aviso na plataforma. A data da última
          atualização consta no topo deste documento. O uso continuado após as
          alterações implica concordância com a versão vigente.
        </p>

        <h2 class="text-lg font-bold text-gray-900 dark:text-white pt-3">11. Encarregado (DPO) e contato</h2>
        <p>
          Para dúvidas, solicitações de direitos ou comunicações sobre proteção de
          dados, contate nosso Encarregado pelo Tratamento de Dados Pessoais (DPO):
        </p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Encarregado (DPO):</strong> [NOME DO ENCARREGADO/DPO]</li>
          <li><strong>E-mail:</strong> <strong>athletto.empresa@gmail.com</strong></li>
        </ul>
        <p>
          Você também pode apresentar reclamação à Autoridade Nacional de Proteção de
          Dados (ANPD) caso entenda que seus direitos não foram atendidos.
        </p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Privacidade — Athletto' })
const dataAtualizacao = '6 de junho de 2026'
</script>
