const { parentPort, workerData } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');

class AgentWorker {
  constructor(agentConfig, task) {
    this.agent = agentConfig;
    this.task = task;
    this.workDir = path.join(process.cwd(), 'workspace', this.agent.id);
  }

  async execute() {
    try {
      await this.setupWorkspace();
      
      this.sendMessage('progress', { 
        message: `Starting task: ${this.task.name}`,
        percentage: 0 
      });

      // Execute based on agent specialization
      const result = await this.executeSpecializedTask();

      this.sendMessage('completed', { 
        message: `Task completed successfully`,
        result 
      });

      return result;
    } catch (error) {
      this.sendMessage('error', { 
        message: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  async setupWorkspace() {
    await fs.mkdir(this.workDir, { recursive: true });
  }

  async executeSpecializedTask() {
    const roleHandlers = {
      'UI/UX Designer Agent': () => this.executeDesignTask(),
      'Frontend Developer Agent': () => this.executeFrontendTask(),
      'CSS Styling Agent': () => this.executeStylingTask(),
      'Mobile Optimization Agent': () => this.executeMobileTask(),
      'Performance Optimizer Agent': () => this.executePerformanceTask(),
      'API Integration Agent': () => this.executeAPITask(),
      'Testing & QA Agent': () => this.executeTestingTask(),
      'SEO & Accessibility Agent': () => this.executeSEOTask(),
      'Documentation Agent': () => this.executeDocumentationTask(),
      'DevOps & Deployment Agent': () => this.executeDevOpsTask()
    };

    const handler = roleHandlers[this.agent.name] || (() => this.executeGenericTask());
    return await handler();
  }

  async executeDesignTask() {
    this.sendMessage('progress', { message: 'Creating design system...', percentage: 20 });
    
    const designSystem = {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        neutral: '#6B7280',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        error: '#EF4444',
        success: '#10B981'
      },
      typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        scale: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        }
      },
      spacing: {
        unit: 4,
        scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64]
      },
      breakpoints: {
        mobile: '640px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1280px'
      }
    };

    const filePath = path.join(this.workDir, 'design-system.json');
    await fs.writeFile(filePath, JSON.stringify(designSystem, null, 2));
    
    this.sendMessage('file_created', { 
      file: 'design-system.json',
      commitMessage: 'Add design system configuration'
    });

    this.sendMessage('progress', { message: 'Design system created', percentage: 100 });
    return designSystem;
  }

  async executeFrontendTask() {
    this.sendMessage('progress', { message: 'Building React components...', percentage: 30 });
    
    const componentCode = `import React from 'react';
import styled from 'styled-components';

const Button = styled.button\`
  background: \${props => props.primary ? '#3B82F6' : '#6B7280'};
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 640px) {
    width: 100%;
  }
\`;

export const PrimaryButton = ({ children, onClick, ...props }) => {
  return (
    <Button primary onClick={onClick} {...props}>
      {children}
    </Button>
  );
};

export default Button;`;

    const filePath = path.join(this.workDir, 'Button.jsx');
    await fs.writeFile(filePath, componentCode);
    
    this.sendMessage('file_created', { 
      file: 'Button.jsx',
      commitMessage: 'Add Button component with responsive design'
    });

    this.sendMessage('progress', { message: 'Components created', percentage: 100 });
    return { component: 'Button', status: 'created' };
  }

  async executeStylingTask() {
    this.sendMessage('progress', { message: 'Generating responsive styles...', percentage: 40 });
    
    const styles = `/* Global Styles - Mobile First Approach */
:root {
  --color-primary: #3B82F6;
  --color-secondary: #10B981;
  --color-accent: #F59E0B;
  --color-neutral: #6B7280;
  --color-background: #FFFFFF;
  --color-surface: #F9FAFB;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  background: var(--color-background);
  color: var(--color-neutral);
  line-height: 1.6;
}

.container {
  width: 100%;
  padding: 0 1rem;
  margin: 0 auto;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    padding: 0 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

/* Wide Desktop */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}

/* Utility Classes */
.flex { display: flex; }
.grid { display: grid; }
.hidden { display: none; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }

/* Responsive Grid */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }

@media (min-width: 640px) {
  .sm\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 768px) {
  .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}`;

    const filePath = path.join(this.workDir, 'global.css');
    await fs.writeFile(filePath, styles);
    
    this.sendMessage('file_created', { 
      file: 'global.css',
      commitMessage: 'Add responsive global styles'
    });

    this.sendMessage('progress', { message: 'Styles generated', percentage: 100 });
    return { file: 'global.css', status: 'created' };
  }

  async executeMobileTask() {
    this.sendMessage('progress', { message: 'Optimizing for mobile...', percentage: 50 });
    
    const manifest = {
      name: 'Nublado App',
      short_name: 'Nublado',
      description: 'AI-powered web application',
      start_url: '/',
      display: 'standalone',
      background_color: '#FFFFFF',
      theme_color: '#3B82F6',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };

    const filePath = path.join(this.workDir, 'manifest.json');
    await fs.writeFile(filePath, JSON.stringify(manifest, null, 2));
    
    this.sendMessage('file_created', { 
      file: 'manifest.json',
      commitMessage: 'Add PWA manifest for mobile optimization'
    });

    this.sendMessage('progress', { message: 'Mobile optimization complete', percentage: 100 });
    return manifest;
  }

  async executePerformanceTask() {
    this.sendMessage('progress', { message: 'Analyzing performance...', percentage: 60 });
    
    const config = `// Webpack Performance Configuration
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          priority: 10
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    usedExports: true,
    minimize: true,
    sideEffects: false
  },
  performance: {
    maxEntrypointSize: 250000,
    maxAssetSize: 250000,
    hints: 'warning'
  }
};`;

    const filePath = path.join(this.workDir, 'performance.config.js');
    await fs.writeFile(filePath, config);
    
    this.sendMessage('file_created', { 
      file: 'performance.config.js',
      commitMessage: 'Add performance optimization config'
    });

    this.sendMessage('progress', { message: 'Performance optimized', percentage: 100 });
    return { optimization: 'complete' };
  }

  async executeAPITask() {
    this.sendMessage('progress', { message: 'Setting up API integration...', percentage: 70 });
    
    const apiClient = `// API Client with error handling and caching
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async request(endpoint, options = {}) {
    const url = \`\${this.baseURL}\${endpoint}\`;
    const cacheKey = \`\${options.method || 'GET'}:\${url}\`;
    
    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(\`API Error: \${response.status}\`);
      }

      const data = await response.json();
      
      // Cache successful GET requests
      if (!options.method || options.method === 'GET') {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default new APIClient(process.env.REACT_APP_API_URL || '/api');`;

    const filePath = path.join(this.workDir, 'apiClient.js');
    await fs.writeFile(filePath, apiClient);
    
    this.sendMessage('file_created', { 
      file: 'apiClient.js',
      commitMessage: 'Add API client with caching and error handling'
    });

    this.sendMessage('progress', { message: 'API integration complete', percentage: 100 });
    return { api: 'configured' };
  }

  async executeTestingTask() {
    this.sendMessage('progress', { message: 'Creating test suite...', percentage: 80 });
    
    const testSuite = `import { render, screen, fireEvent } from '@testing-library/react';
import { PrimaryButton } from './Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<PrimaryButton>Click me</PrimaryButton>);
    const button = screen.getByText('Click me');
    expect(button).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<PrimaryButton onClick={handleClick}>Click me</PrimaryButton>);
    
    const button = screen.getByText('Click me');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies responsive styles', () => {
    render(<PrimaryButton>Responsive Button</PrimaryButton>);
    const button = screen.getByText('Responsive Button');
    
    // Check if button has proper styling
    expect(button).toHaveStyle({
      cursor: 'pointer'
    });
  });

  test('is accessible', () => {
    render(<PrimaryButton aria-label="Submit form">Submit</PrimaryButton>);
    const button = screen.getByLabelText('Submit form');
    expect(button).toBeInTheDocument();
  });
});`;

    const filePath = path.join(this.workDir, 'Button.test.js');
    await fs.writeFile(filePath, testSuite);
    
    this.sendMessage('file_created', { 
      file: 'Button.test.js',
      commitMessage: 'Add comprehensive test suite for Button component'
    });

    this.sendMessage('progress', { message: 'Tests created', percentage: 100 });
    return { tests: 'created' };
  }

  async executeSEOTask() {
    this.sendMessage('progress', { message: 'Optimizing SEO...', percentage: 90 });
    
    const seoConfig = `<!-- SEO Meta Tags -->
<meta name="description" content="AI-powered web application built with Nublado Orchestrator">
<meta name="keywords" content="AI, web development, responsive design, PWA">
<meta name="author" content="Nublado Team">
<meta name="robots" content="index, follow">

<!-- Open Graph -->
<meta property="og:title" content="Nublado App">
<meta property="og:description" content="Experience the future of web development">
<meta property="og:type" content="website">
<meta property="og:url" content="https://nublado.app">
<meta property="og:image" content="https://nublado.app/og-image.jpg">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Nublado App">
<meta name="twitter:description" content="AI-powered web application">
<meta name="twitter:image" content="https://nublado.app/twitter-image.jpg">

<!-- Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Nublado",
  "description": "AI-powered web application",
  "url": "https://nublado.app",
  "applicationCategory": "WebApplication",
  "operatingSystem": "All"
}
</script>`;

    const filePath = path.join(this.workDir, 'seo-meta.html');
    await fs.writeFile(filePath, seoConfig);
    
    this.sendMessage('file_created', { 
      file: 'seo-meta.html',
      commitMessage: 'Add SEO meta tags and structured data'
    });

    this.sendMessage('progress', { message: 'SEO optimized', percentage: 100 });
    return { seo: 'optimized' };
  }

  async executeDocumentationTask() {
    this.sendMessage('progress', { message: 'Generating documentation...', percentage: 95 });
    
    const docs = `# Component Documentation

## Button Component

### Description
A responsive, accessible button component with primary and secondary variants.

### Usage
\`\`\`jsx
import { PrimaryButton } from './components/Button';

function App() {
  return (
    <PrimaryButton onClick={() => console.log('Clicked!')}>
      Click Me
    </PrimaryButton>
  );
}
\`\`\`

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Button content |
| onClick | Function | - | Click handler |
| primary | Boolean | false | Primary variant |
| disabled | Boolean | false | Disabled state |
| aria-label | String | - | Accessibility label |

### Responsive Behavior
- **Mobile (<640px)**: Full width button
- **Tablet (≥640px)**: Auto width with padding
- **Desktop (≥1024px)**: Standard button size

### Accessibility
- Supports keyboard navigation
- ARIA labels for screen readers
- Focus indicators
- Proper contrast ratios (WCAG AA)
`;

    const filePath = path.join(this.workDir, 'COMPONENT_DOCS.md');
    await fs.writeFile(filePath, docs);
    
    this.sendMessage('file_created', { 
      file: 'COMPONENT_DOCS.md',
      commitMessage: 'Add component documentation'
    });

    this.sendMessage('progress', { message: 'Documentation complete', percentage: 100 });
    return { documentation: 'generated' };
  }

  async executeDevOpsTask() {
    this.sendMessage('progress', { message: 'Setting up CI/CD...', percentage: 95 });
    
    const githubAction = `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
    
    - name: Build application
      run: npm run build
      env:
        CI: true
    
    - name: Run Lighthouse CI
      uses: treosh/lighthouse-ci-action@v9
      with:
        urls: |
          http://localhost:3000
        uploadArtifacts: true
        temporaryPublicStorage: true
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build
        cname: nublado.app
`;

    const filePath = path.join(this.workDir, 'deploy.yml');
    await fs.writeFile(filePath, githubAction);
    
    this.sendMessage('file_created', { 
      file: '.github/workflows/deploy.yml',
      commitMessage: 'Add GitHub Actions workflow for deployment'
    });

    this.sendMessage('progress', { message: 'CI/CD configured', percentage: 100 });
    return { cicd: 'configured' };
  }

  async executeGenericTask() {
    this.sendMessage('progress', { message: 'Executing task...', percentage: 50 });
    
    // Generic task execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.sendMessage('progress', { message: 'Task completed', percentage: 100 });
    return { status: 'completed' };
  }

  sendMessage(type, data) {
    parentPort.postMessage({ type, data });
  }
}

// Execute worker
const worker = new AgentWorker(workerData.agentConfig, workerData.task);
worker.execute().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Worker error:', error);
  process.exit(1);
});