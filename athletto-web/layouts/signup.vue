<template>
  <div class="h-screen flex overflow-hidden bg-white">

    <!-- ══ LEFT — Form panel ══════════════════════════════════════════════ -->
    <div class="flex-1 flex flex-col h-full px-6 sm:px-10 lg:px-12 xl:px-16">
      <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div class="flex flex-col items-center justify-center min-h-full py-6">
          <div class="w-full max-w-sm">
            <slot />
          </div>
        </div>
      </div>
    </div>

    <!-- ══ RIGHT — Sports image panel ═══════════════════════════════════ -->
    <div class="hidden lg:block lg:w-[42%] xl:w-[46%] relative overflow-hidden">
      <img
        src="https://images.pexels.com/photos/26283685/pexels-photo-26283685.jpeg"
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
