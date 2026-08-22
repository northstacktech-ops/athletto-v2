import type { StorybookConfig } from '@storybook-vue/nuxt';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const config: StorybookConfig = {
  "stories": [
    "../components/**/*.mdx",
    "../components/**/*.stories.@(js|jsx|ts|tsx|mdx)"
  ],
  "addons": [
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": "@storybook-vue/nuxt",
  // @storybook-vue/nuxt mescla a config do Vite do Nuxt com a config base do
  // Storybook, e nessa mesclagem o postcss/Tailwind injetado pelo módulo
  // @nuxtjs/tailwindcss acaba se perdendo — forçamos aqui por fora.
  async viteFinal(viteConfig) {
    viteConfig.css ??= {};
    viteConfig.css.postcss = {
      plugins: [tailwindcss('./tailwind.config.ts'), autoprefixer()],
    };
    return viteConfig;
  },
};
export default config;