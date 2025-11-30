// https://nuxt.com/docs/api/configuration/nuxt-config
// nuxt.config.ts
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
    },
  },
  build: {
    transpile: ["vuetify"],
  },
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
    //...
  ],
  srcDir: "src/",
  typescript: {
    shim: false,
  },
  css: ["~/assets/global.css"],
  app: {
    head: {
      title: "Law Consultant - Tư vấn pháp lý AI",
      titleTemplate: "%s | Law Consultant",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Hệ thống tư vấn pháp lý thông minh với AI - Law Consultant giúp bạn giải đáp các vấn đề pháp lý một cách nhanh chóng và chính xác",
        },
        {
          name: "keywords",
          content:
            "tư vấn pháp lý, law consultant, AI, pháp luật, legal advice, luật sư AI",
        },
        { name: "author", content: "Law Consultant Team" },
        { property: "og:type", content: "website" },
        { property: "og:title", content: "Law Consultant - Tư vấn pháp lý AI" },
        {
          property: "og:description",
          content: "Hệ thống tư vấn pháp lý thông minh với AI",
        },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Law Consultant - Tư vấn pháp lý AI",
        },
        {
          name: "twitter:description",
          content: "Hệ thống tư vấn pháp lý thông minh với AI",
        },
      ],
      link: [
        // {
        //   rel: "stylesheet",
        //   href: "https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css",
        // },
        {
          rel: "preload",
          as: "image",
          href: "/images/login_background.webp",
        },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      ],
    },
  },
  components: [
    {
      path: "~/components",
      pathPrefix: false, // không cần gọi <LayoutHeader /> mà chỉ <Header />
    },
    {
      path: "~/components/layout",
      pathPrefix: false,
    },
  ],
  vite: {
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Fragment",
    },
    // vue: {
    //   template: {
    //     transformAssetUrls,
    //   },
    // },
  },
});
