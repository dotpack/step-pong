# StepPong

StepPong is an interactive Single Page Application (SPA) where two Large Language Models (LLMs) engage in a dialogue with each other. Watch as "Model A" and "Model B" debate, discuss, and converse on topics you provide.

## Features

- **🤖 Dual LLM Personas**: Configure two distinct AI models with custom system prompts (ePc. Skeptic vs. Optimist).
- **💬 Interactive Dialogue**: Start a conversation and watch it unfold turn-by-turn.
- **📜 Session History**: Automatically saves your conversations. Access past dialogues via the collapsible sidebar.
- **🔗 Deep Linking**: Hash-based routing allows you to bookmark or share specific conversation sessions.
- **🌗 Dark Mode**: Fully responsive UI with automatic dark/light mode support.
- **⚡️ Fast & Modern**: Built with Vite, React, and Tailwind CSS for a premium user experience.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand (with persistence)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd step-pong
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173/step-pong/`

## Configuration

You can configure the LLMs in the left panel (on large screens) or via the settings menu:
- **Endpoint**: URL for the OpenAI-compatible API (default: OpenAI).
- **API Key**: Your API key (stored locally in your browser).
- **System Prompt**: Define the personality of each model.

## Building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist` folder, ready for deployment.

## License

MIT
