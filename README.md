- database: convex

- [x] "npx create-next-app@latest {project-name}" to initialize nextjs
- [x] change layout, delete assets, change metadata
- [x] remove page.tsx // balance page
- [x] create .env file, add .env to .gitignore
- [x] add .prettierrc

- [x] "npx shadcn-ui@latest init" to initialize shadcn
- [x] html, body, :root { height: 100% } thing at app/globals.css

- [x] "npm i @clerk/nextjs", middleware ve (auth) kullanmadık
- [x] create clerk project
- [x] add keys to .env
- [x] create jwt template and select convex, copy issuer and save

- [x] "npm i convex"
- [x] "npx convex dev" to run convex, change .env.local to .env
- [x] create /convex/auth.config.js and add issuer url as domain
- [x] add providers/convex-provider.tsx, combine clerk and convex providers and wrap {children} with ConvexProvider

- [x] enable organizations in clerk
- [x] add org_role and org_id to jwt template

- [x] create liveblocks project
- [x] "npm i @liveblocks/client @liveblocks/react"
- [x] "npx create-liveblocks-app@latest" and add key to .env as LIVEBLOCK_API_KEY
- [ ] add Room.tsx

---

- primary stack: nextjs13-app-nosrc, react, shadcn, tailwind, convex, clerk-withorg
- secondary stack: zustand, liveblocks
- extra: date-fns, use-hooks
- ui: font = poppins-inter, icons = lucide

---

- AuthLoading ve Authenticated kullanarak login sırasında bir loading animation yapabiliyosun
- Clerk yazısını dev moddayken kapatabiliyosun
- searchparams, state yönetiminden daha mantıklı
- clerk > customization > avatars kısmından default resmi isme göre harf olarak değiştirebilirsin
- useDebounce ile inputlarda zaman aralıklı state değişimi yapıyor
- her bir durum için ayrı empty state'ler yapmayı unutma
- formatDistanceToNow ile related date yazabiliyosun
- many-to-one ya da many-to-one relationlar için ayrı veri yapıları tutuyoruz
- Component.Skeleton kullanırken ayrı bir use client Loading dosyası açıp her şeyi onda birleştir
