تمام ✅ خلينا نضيف خطوات **تثبيت Node.js و npm** وكمان **تثبيت dependencies** (`npm i`) قبل التشغيل. هتكون موجودة في بداية الـ README عشان أي حد يبدأ يشتغل يعرف يعمل الإعداد من الأول.

الكود بعد التعديل 👇
To re-enable stories later
Set STORIES_ENABLED = true in src/lib/features/storiesEnabled.ts
Uncomment getStories in queries/home.ts
Uncomment story vars in loadHomeGraphqlData.ts
Uncomment the StoryServer block in page.tsx
````markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Installation

First, make sure you have [Node.js](https://nodejs.org/) and npm installed:

- [Download Node.js](https://nodejs.org/en/download/) (comes with npm)
- Verify installation:
  ```bash
  node -v
  npm -v
````

Then install project dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

---

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

---

## Run in Production

To build and run the app in **production** mode:

```bash
npm run build
npm run start
```

Now open [http://localhost:3000](http://localhost:3000) to see the production version of your app.

---

## Learn More

To learn more about Next.js, take a look at the following resources:

* [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
* [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

---

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
