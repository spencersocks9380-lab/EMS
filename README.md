# EMS Dashboard

A simple employee management dashboard built with Next.js, Saas UI, Chakra UI, and TypeScript.

## Tech Stack

- Next.js 16
- React 19
- Saas UI
- Chakra UI
- TypeScript
- Tailwind CSS

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

On Windows PowerShell, if script execution is blocked, use:

```bash
npm.cmd run dev
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project Structure

```text
app/
  globals.css      Global styles
  layout.tsx       Root app layout and metadata
  page.tsx         EMS dashboard page
  providers.tsx    Saas UI provider
public/
  globe.svg        Header logo asset
```

## Build

Create a production build:

```bash
npm run build
```

If PowerShell blocks `npm`, run:

```bash
npm.cmd run build
```
