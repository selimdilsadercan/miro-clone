- database: coacrochdb, softwarepathandcv@gmail.com

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
