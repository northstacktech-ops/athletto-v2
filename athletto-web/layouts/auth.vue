<template>
  <div class="h-screen flex overflow-hidden bg-white">

    <!-- ══ LEFT — Form panel ══════════════════════════════════════════════ -->
    <div class="flex-1 flex flex-col h-full px-6 py-5 sm:px-10 lg:px-12 xl:px-16">

      <!-- Logo -->
      <div class="flex items-center gap-2.5 shrink-0">
        <BrandMark class="w-8 h-8 shrink-0 text-[#1A1A1A]" />
        <span class="text-lg font-extrabold text-gray-900 tracking-tight">Athletto</span>
      </div>

      <!-- Slot — min-h-full garante centralização quando cabe e scroll completo quando não cabe -->
      <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div class="flex flex-col items-center justify-center min-h-full py-8">
          <div class="w-full max-w-sm">
            <slot />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between text-xs text-gray-400 shrink-0">
        <span>© {{ new Date().getFullYear() }} Athletto. Todos os direitos reservados.</span>
        <a href="#" class="hover:text-gray-600 transition-colors">Política de privacidade</a>
      </div>
    </div>

    <!-- ══ RIGHT — Sports image panel ═══════════════════════════════════ -->
    <div class="hidden lg:block lg:w-[42%] xl:w-[46%] relative overflow-hidden">
      <!-- Parâmetros do CDN da Pexels: comprime e redimensiona (antes baixava o original com vários MB) -->
      <img
        src="https://images.pexels.com/photos/26283685/pexels-photo-26283685.jpeg?auto=compress&cs=tinysrgb&w=1400"
        alt=""
        class="absolute inset-0 w-full h-full object-cover object-[center_60%]"
        aria-hidden="true"
      />
      <div
        class="absolute inset-x-0 bottom-0 flex flex-col justify-end px-10 xl:px-14 pb-12"
        style="height: 75%; background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 35%, rgba(0,0,0,0.35) 60%, transparent 100%);"
      >
        <p class="text-2xl xl:text-3xl font-extrabold text-white leading-snug">
          Do treino ao financeiro,<br>tudo em um só lugar.
        </p>
        <p class="mt-2 text-sm text-white/60 font-medium">
          Athletto — Gestão esportiva inteligente para o seu clube.
        </p>
      </div>
    </div>

    <!-- Toasts -->
    <UiToastContainer />
  </div>
</template>

<script setup lang="ts">
</script>
