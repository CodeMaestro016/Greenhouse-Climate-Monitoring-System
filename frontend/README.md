
  # Greenhouse Climate Monitoring System


  ## Overview

  This project provides a modern, data-rich interface for greenhouse operations, including:

  - Live environmental sensor cards (temperature, humidity, soil moisture, light)
  - Risk and warning panels for operational awareness
  - Historical trend charts and analytics visualizations
  - Action-oriented recommendations for greenhouse interventions



  ## Tech Stack

  - React 18
  - Vite 6
  - TypeScript (app entry and configuration)
  - Recharts for charting
  - Tailwind CSS and component utilities (Radix primitives + custom UI)

  ## Prerequisites

  - Node.js 18+ (recommended)
  - npm 9+ (or a compatible npm version bundled with Node.js)

  ## Getting Started

  1. Install dependencies:

  ```bash
  npm install
  ```

  2. Start development server:

  ```bash
  npm run dev
  ```

  3. Open the local URL shown in the terminal (typically `http://localhost:5173`).

  ## Available Scripts

  - `npm run dev`: Start the Vite development server
  - `npm run build`: Create a production build in `dist/`

  ## Project Structure

  ```text
  src/
    main.tsx                # Application bootstrap
    app/
      App.tsx               # Main greenhouse dashboard screen
      components/           # Reusable dashboard sections and UI building blocks
    styles/                 # Global styles, fonts, Tailwind/theme files
  ```

  ## Notes

  - This repository includes generated and reusable UI primitives under `src/app/components/ui/`.
  - Build output is generated in `dist/`.
  - A project `.gitignore` is configured to exclude dependencies, build artifacts, logs, and local editor files.
  