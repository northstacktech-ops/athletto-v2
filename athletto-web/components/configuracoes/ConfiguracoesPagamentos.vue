<template>
  <div class="space-y-4">
    <div class="card-base p-5 space-y-4">
      <div>
        <h2 class="text-base font-bold text-slate-900 dark:text-white">Conta de recebimento (Pix)</h2>
        <p class="text-sm text-slate-500 mt-1 leading-relaxed">
          As mensalidades pagas pelos atletas caem <strong>direto na conta do seu clube</strong> via <strong>ValidaPay</strong>.
          Para isso, criamos uma conta de recebimento (subconta) no seu nome — preencha os dados abaixo uma única vez.
        </p>
      </div>

      <!-- Só o principal configura -->
      <div v-if="gestor?.role !== 'principal'" class="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
        Apenas o gestor principal pode configurar a conta de pagamento.
      </div>

      <template v-else>
        <!-- Carregando status -->
        <div v-if="carregando" class="text-sm text-slate-500 py-2">Verificando status da conta…</div>

        <!-- Aprovado -->
        <div v-else-if="status?.status === 'aprovado'" class="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
          <svg class="w-5 h-5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <div>
            <p class="text-sm font-semibold text-slate-900 dark:text-white">Conta aprovada e recebendo</p>
            <p class="text-xs text-slate-500">As cobranças geram Pix direto na conta do clube{{ status.account_number ? ` (nº ${status.account_number})` : '' }}.</p>
          </div>
        </div>

        <!-- Pendente (e não editando) -->
        <div v-else-if="status?.status === 'pendente' && !editando" class="space-y-3">
          <div class="flex items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
            <div class="flex items-center gap-2.5">
              <svg class="w-5 h-5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <div>
                <p class="text-sm font-semibold text-slate-900 dark:text-white">Conta em análise</p>
                <p class="text-xs text-slate-500">Enviamos seus dados para a ValidaPay. A aprovação chega automaticamente.</p>
              </div>
            </div>
            <button class="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/[0.12] hover:bg-slate-50 dark:hover:bg-white/[0.06] disabled:opacity-50" :disabled="carregando || verificando" @click="verificar">{{ verificando ? 'Verificando…' : 'Atualizar' }}</button>
          </div>
          <div class="flex items-center justify-between">
            <button class="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400" @click="showAnalise = true">
              Ver o que fazer enquanto isso →
            </button>
            <button class="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2" @click="editando = true">
              Dados incorretos? Corrigir cadastro
            </button>
          </div>
        </div>

        <!-- Recusado, não conectado, ou corrigindo pendente → formulário -->
        <template v-else>
          <div v-if="status?.status === 'recusado'" class="text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">
            <strong>Cadastro não aprovado.</strong> Corrija os dados abaixo e envie novamente.
            <span v-if="status.ultimo_erro" class="block mt-1 text-xs">Motivo: {{ status.ultimo_erro }}</span>
          </div>
          <div v-else-if="editando" class="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 flex items-start justify-between gap-3">
            <span>Preencha os dados corrigidos abaixo. Uma nova proposta será enviada para a ValidaPay.</span>
            <button class="shrink-0 text-xs underline underline-offset-2" @click="editando = false">Cancelar</button>
          </div>

          <!-- Tipo de conta -->
          <div class="flex gap-2">
            <button
              v-for="t in (['pf','pj'] as const)" :key="t"
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
              :class="tipo === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 dark:border-white/[0.12] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06]'"
              @click="tipo = t"
            >{{ t === 'pf' ? 'Pessoa física (CPF)' : 'Pessoa jurídica (CNPJ)' }}</button>
          </div>

          <form class="space-y-3" @submit.prevent="enviar">
            <!-- Identificação -->
            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="lbl">{{ tipo === 'pf' ? 'CPF *' : 'CNPJ *' }}</label>
                <input v-model="f.documentNumber" class="form-input" :class="{ 'err': erros.documentNumber }" :placeholder="tipo === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'" @input="delete erros.documentNumber" />
                <p v-if="erros.documentNumber" class="msg-err">{{ erros.documentNumber }}</p>
              </div>
              <div v-if="tipo === 'pf'">
                <label class="lbl">Nome completo *</label>
                <input v-model="f.fullName" class="form-input" :class="{ 'err': erros.fullName }" @input="delete erros.fullName" />
                <p v-if="erros.fullName" class="msg-err">{{ erros.fullName }}</p>
              </div>
              <div v-else>
                <label class="lbl">Razão social *</label>
                <input v-model="f.companyName" class="form-input" :class="{ 'err': erros.companyName }" @input="delete erros.companyName" />
                <p v-if="erros.companyName" class="msg-err">{{ erros.companyName }}</p>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div v-if="tipo === 'pf'">
                <label class="lbl">Nome da mãe *</label>
                <input v-model="f.motherName" class="form-input" :class="{ 'err': erros.motherName }" @input="delete erros.motherName" />
                <p v-if="erros.motherName" class="msg-err">{{ erros.motherName }}</p>
              </div>
              <div v-if="tipo === 'pf'">
                <label class="lbl">Data de nascimento *</label>
                <input v-model="f.birthDate" type="date" class="form-input" :class="{ 'err': erros.birthDate }" @input="delete erros.birthDate" />
                <p v-if="erros.birthDate" class="msg-err">{{ erros.birthDate }}</p>
              </div>
              <div v-if="tipo === 'pj'">
                <label class="lbl">Nome fantasia</label>
                <input v-model="f.tradingName" class="form-input" />
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="lbl">E-mail *</label>
                <input v-model="f.email" type="email" class="form-input" :class="{ 'err': erros.email }" @input="delete erros.email" />
                <p v-if="erros.email" class="msg-err">{{ erros.email }}</p>
              </div>
              <div>
                <label class="lbl">Telefone * <span class="text-xs font-normal text-slate-400">(com DDD)</span></label>
                <input v-model="f.phoneNumber" class="form-input" :class="{ 'err': erros.phoneNumber }" placeholder="(11) 99999-9999" @input="delete erros.phoneNumber" />
                <p v-if="erros.phoneNumber" class="msg-err">{{ erros.phoneNumber }}</p>
              </div>
            </div>

            <!-- Endereço -->
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide pt-1">Endereço</p>
            <div class="grid sm:grid-cols-3 gap-3">
              <div>
                <label class="lbl">CEP *</label>
                <input v-model="f.address.postalCode" class="form-input" :class="{ 'err': erros['address.postalCode'] }" placeholder="00000-000" @blur="buscarCep" @input="delete erros['address.postalCode']" />
                <p v-if="erros['address.postalCode']" class="msg-err">{{ erros['address.postalCode'] }}</p>
              </div>
              <div class="sm:col-span-2">
                <label class="lbl">Rua *</label>
                <input v-model="f.address.street" class="form-input" :class="{ 'err': erros['address.street'] }" @input="delete erros['address.street']" />
                <p v-if="erros['address.street']" class="msg-err">{{ erros['address.street'] }}</p>
              </div>
            </div>
            <div class="grid sm:grid-cols-3 gap-3">
              <div>
                <label class="lbl">Número *</label>
                <input v-model="f.address.number" class="form-input" :class="{ 'err': erros['address.number'] }" @input="delete erros['address.number']" />
                <p v-if="erros['address.number']" class="msg-err">{{ erros['address.number'] }}</p>
              </div>
              <div>
                <label class="lbl">Complemento</label>
                <input v-model="f.address.addressComplement" class="form-input" />
              </div>
              <div>
                <label class="lbl">Bairro *</label>
                <input v-model="f.address.neighborhood" class="form-input" :class="{ 'err': erros['address.neighborhood'] }" @input="delete erros['address.neighborhood']" />
                <p v-if="erros['address.neighborhood']" class="msg-err">{{ erros['address.neighborhood'] }}</p>
              </div>
            </div>
            <div class="grid sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="lbl">Cidade *</label>
                <input v-model="f.address.city" class="form-input" :class="{ 'err': erros['address.city'] }" @input="delete erros['address.city']" />
                <p v-if="erros['address.city']" class="msg-err">{{ erros['address.city'] }}</p>
              </div>
              <div>
                <label class="lbl">UF *</label>
                <input v-model="f.address.state" maxlength="2" class="form-input uppercase" :class="{ 'err': erros['address.state'] }" placeholder="SP" @input="delete erros['address.state']" />
                <p v-if="erros['address.state']" class="msg-err">{{ erros['address.state'] }}</p>
              </div>
            </div>

            <!-- Dados financeiros -->
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide pt-1">Dados financeiros</p>
            <div v-if="tipo === 'pf'" class="grid sm:grid-cols-3 gap-3">
              <div>
                <label class="lbl">Renda mensal (R$) *</label>
                <input v-model="f.declaredIncome" inputmode="numeric" class="form-input" :class="{ 'err': erros.declaredIncome }" placeholder="3000" @input="delete erros.declaredIncome" />
                <p v-if="erros.declaredIncome" class="msg-err">{{ erros.declaredIncome }}</p>
              </div>
              <div>
                <label class="lbl">Patrimônio (R$) *</label>
                <input v-model="f.netWorth" inputmode="numeric" class="form-input" :class="{ 'err': erros.netWorth }" placeholder="20000" @input="delete erros.netWorth" />
                <p v-if="erros.netWorth" class="msg-err">{{ erros.netWorth }}</p>
              </div>
              <div>
                <label class="lbl">Ocupação *</label>
                <input v-model="f.occupation" class="form-input" :class="{ 'err': erros.occupation }" placeholder="Ex.: Professor" @input="delete erros.occupation" />
                <p v-if="erros.occupation" class="msg-err">{{ erros.occupation }}</p>
              </div>
            </div>
            <div v-else>
              <label class="lbl">Faturamento mensal (R$) *</label>
              <input v-model="f.monthlyRevenue" inputmode="numeric" class="form-input" :class="{ 'err': erros.monthlyRevenue }" placeholder="10000" @input="delete erros.monthlyRevenue" />
              <p v-if="erros.monthlyRevenue" class="msg-err">{{ erros.monthlyRevenue }}</p>
            </div>

            <label v-if="tipo === 'pf'" class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 pt-1">
              <input v-model="f.isPoliticallyExposedPerson" type="checkbox" class="rounded border-slate-300" />
              Sou pessoa politicamente exposta (PEP)
            </label>

            <div v-if="temErros" class="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
              Corrija os campos em vermelho antes de continuar.
            </div>

            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
              :disabled="salvando"
            >{{ salvando ? 'Enviando…' : 'Criar conta de recebimento' }}</button>
            <p class="text-xs text-slate-400">Os dados vão direto para a ValidaPay (parceiro de pagamento). O Athletto não retém o dinheiro das mensalidades.</p>
          </form>
        </template>
      </template>
    </div>

    <ConfiguracoesAnaliseModal :open="showAnalise" @close="showAnalise = false" />
  </div>
</template>

<script setup lang="ts">
const { gestor } = useAuth()
const equipe = useEquipe()
const toast = useToast()

const carregando = ref(true)
const salvando = ref(false)
const verificando = ref(false)
const editando = ref(false)
const showAnalise = ref(false)
const status = ref<{ status: string; account_number: string | null; tipo: string; document_number: string | null; ultimo_erro: string | null; atualizado_em: string } | null>(null)
const tipo = ref<'pf' | 'pj'>('pf')
watch(tipo, () => Object.keys(erros).forEach(k => delete erros[k]))

const f = reactive({
  documentNumber: '',
  fullName: '',
  companyName: '',
  tradingName: '',
  motherName: '',
  birthDate: '',
  email: '',
  phoneNumber: '',
  address: { postalCode: '', street: '', number: '', addressComplement: '', neighborhood: '', city: '', state: '' },
  declaredIncome: '',
  netWorth: '',
  occupation: '',
  monthlyRevenue: '',
  isPoliticallyExposedPerson: false,
})

const erros = reactive<Record<string, string>>({})
const temErros = computed(() => Object.keys(erros).length > 0)

function validar(): boolean {
  Object.keys(erros).forEach(k => delete erros[k])
  const e: Record<string, string> = {}

  // Documento
  const doc = f.documentNumber.replace(/\D/g, '')
  if (!doc) {
    e.documentNumber = 'Obrigatório'
  } else if (tipo.value === 'pf' && doc.length !== 11) {
    e.documentNumber = 'CPF inválido — informe os 11 dígitos'
  } else if (tipo.value === 'pj' && doc.length !== 14) {
    e.documentNumber = 'CNPJ inválido — informe os 14 dígitos'
  }

  if (tipo.value === 'pf') {
    if (!f.fullName.trim()) e.fullName = 'Obrigatório'
    if (!f.motherName.trim()) e.motherName = 'Obrigatório'
    if (!f.birthDate) e.birthDate = 'Obrigatório'
    if (!f.declaredIncome.replace(/\D/g, '')) e.declaredIncome = 'Obrigatório'
    if (!f.netWorth.replace(/\D/g, '')) e.netWorth = 'Obrigatório'
    if (!f.occupation.trim()) e.occupation = 'Obrigatório'
  } else {
    if (!f.companyName.trim()) e.companyName = 'Obrigatório'
    if (!f.monthlyRevenue.replace(/\D/g, '')) e.monthlyRevenue = 'Obrigatório'
  }

  // E-mail
  if (!f.email.trim()) {
    e.email = 'Obrigatório'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) {
    e.email = 'E-mail inválido'
  }

  // Telefone — aceita com ou sem DDI 55 (+55 ou 55 no início)
  const telRaw = f.phoneNumber.replace(/\D/g, '')
  const tel = (telRaw.startsWith('55') && (telRaw.length === 12 || telRaw.length === 13))
    ? telRaw.slice(2)
    : telRaw
  if (!telRaw) {
    e.phoneNumber = 'Obrigatório — informe DDD + número (ex: 11 99999-9999)'
  } else if (tel.length < 10 || tel.length > 11) {
    e.phoneNumber = 'Telefone inválido — informe DDD + número (ex: 11 99999-9999 ou +55 11 99999-9999)'
  }

  // Endereço
  const cep = f.address.postalCode.replace(/\D/g, '')
  if (!cep) e['address.postalCode'] = 'Obrigatório'
  else if (cep.length !== 8) e['address.postalCode'] = 'CEP inválido — 8 dígitos esperados'
  if (!f.address.street.trim()) e['address.street'] = 'Obrigatório'
  if (!f.address.number.trim()) e['address.number'] = 'Obrigatório'
  if (!f.address.neighborhood.trim()) e['address.neighborhood'] = 'Obrigatório'
  if (!f.address.city.trim()) e['address.city'] = 'Obrigatório'
  const uf = f.address.state.trim()
  if (!uf) e['address.state'] = 'Obrigatório'
  else if (uf.length !== 2) e['address.state'] = 'UF inválida — use 2 letras (ex: SP)'

  Object.assign(erros, e)
  return Object.keys(e).length === 0
}

async function recarregar() {
  carregando.value = true
  const { data } = await equipe.statusValidapay()
  status.value = data
  // Pré-preenche tipo e documento com o que está salvo no banco.
  if (data) {
    tipo.value = (data.tipo as 'pf' | 'pj') || 'pf'
    if (data.document_number && !f.documentNumber) {
      f.documentNumber = data.document_number
    }
  }
  carregando.value = false
}
onMounted(recarregar)

// Consulta a ValidaPay o status real (não depende do webhook) e atualiza.
async function verificar() {
  verificando.value = true
  const { data, error } = await equipe.verificarStatusValidapay()
  if (error) toast.error('Não foi possível verificar', String(error))
  else if ((data as any)?.status === 'aprovado') toast.success('Conta aprovada!', 'Você já pode receber via Pix.')
  else if ((data as any)?.status === 'recusado') toast.error('Cadastro não aprovado', (data as any)?.erro ?? 'Revise os dados e envie novamente.')
  else toast.info('Ainda em análise', 'Sua conta segue em validação na ValidaPay.')
  await recarregar()
  verificando.value = false
}

// Autofill de endereço pelo CEP (ViaCEP — público, sem chave).
async function buscarCep() {
  const cep = f.address.postalCode.replace(/\D/g, '')
  if (cep.length !== 8) return
  try {
    const r = await $fetch<any>(`https://viacep.com.br/ws/${cep}/json/`)
    if (r && !r.erro) {
      f.address.street = r.logradouro || f.address.street
      f.address.neighborhood = r.bairro || f.address.neighborhood
      f.address.city = r.localidade || f.address.city
      f.address.state = r.uf || f.address.state
    }
  } catch { /* silencioso — usuário preenche manualmente */ }
}

function montarDados() {
  const address = {
    postalCode: f.address.postalCode.replace(/\D/g, ''),
    street: f.address.street.trim(),
    number: f.address.number.trim(),
    addressComplement: f.address.addressComplement.trim() || undefined,
    neighborhood: f.address.neighborhood.trim(),
    city: f.address.city.trim(),
    state: f.address.state.trim().toUpperCase(),
  }
  if (tipo.value === 'pf') {
    return {
      documentNumber: f.documentNumber.replace(/\D/g, ''),
      fullName: f.fullName.trim(),
      motherName: f.motherName.trim(),
      birthDate: f.birthDate, // YYYY-MM-DD — formato esperado pela ValidaPay para PF
      email: f.email.trim(),
      phoneNumber: f.phoneNumber, // servidor normaliza para E.164 (+55...)
      address,
      isPoliticallyExposedPerson: f.isPoliticallyExposedPerson,
      financialDetails: {
        declaredIncome: f.declaredIncome.replace(/\D/g, ''),
        occupation: f.occupation.trim(),
        netWorth: f.netWorth.replace(/\D/g, ''),
      },
    }
  }
  // PJ — nomes de campos conforme documentação ValidaPay
  return {
    documentNumber: f.documentNumber.replace(/\D/g, ''),
    businessName: f.companyName.trim(),
    tradingName: f.tradingName.trim() || undefined,
    businessEmail: f.email.trim(),
    contactNumber: f.phoneNumber, // servidor normaliza para E.164 (+55...)
    companyType: 'PJ' as const,
    businessAddress: address,
    financialCompanyDetails: { declaredCompanyRevenue: f.monthlyRevenue.replace(/\D/g, '') },
  }
}

async function enviar() {
  if (!validar()) return
  salvando.value = true
  const { error } = await equipe.criarSubcontaValidapay({ tipo: tipo.value, dados: montarDados() })
  if (error) {
    toast.error('Não foi possível criar a conta', String(error))
  } else {
    toast.success('Conta enviada', 'Seus dados foram enviados para análise.')
    editando.value = false
    await recarregar()
    showAnalise.value = true
  }
  salvando.value = false
}
</script>

<style scoped>
.lbl { @apply block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1; }
.err { @apply border-rose-500 dark:border-rose-500 focus:ring-rose-500 focus:border-rose-500; }
.msg-err { @apply text-xs text-rose-600 dark:text-rose-400 mt-1; }
</style>
