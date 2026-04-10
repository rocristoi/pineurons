# Pineurons Web Interface

Modern, high-performance conversational frontend built with Next.js. This application is designed to deliver a fast and responsive user experience for interacting with generative systems.

## Architecture and Efficiency

This app is optimized for speed and fluidity. It leverages Next.js to provide streamlined rendering and state management. Key performance benefits include:

*   **Modular Design:** The interface relies on isolated components and stateful logic (`ChatContainer`, `MessageBubble`, `PromptChips`) to restrict re-renders to only the elements undergoing change.

## Backend Role

The web application interfaces with a dedicated Python backend service. This backend exists solely to host and execute specialized machine learning model inference. 

By structuring the architecture this way, heavy model inferences and computational workloads are entirely isolated from the Node.js environment. This prevents the primary web server loop from being choked by data-processing computations. This ensures the frontend remains completely responsive during complex generative operations and allows the web and computation layers to be scaled and managed independently.

## Getting Started

### Prerequisites

*   Node.js

### Installation

Install the necessary dependencies from the root directory:

```bash
npm install
```

### Development

Run the Next.js development server:

```bash
npm run dev
```

Navigate to `http://localhost:3000` to interact with the frontend.
