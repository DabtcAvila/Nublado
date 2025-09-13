#!/usr/bin/env node

const CoreAgent = require('./core_agent');
const fs = require('fs').promises;
const path = require('path');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

class CSSStylingAgent extends CoreAgent {
  constructor(config = {}) {
    super({
      ...config,
      id: 'agent_003',
      name: 'CSS Styling Agent',
      type: 'stylist',
      capabilities: [
        'css3',
        'sass',
        'tailwind',
        'css-in-js',
        'flexbox',
        'grid',
        'animations',
        'transitions',
        'responsive_design',
        'css_modules',
        'styled_components',
        'postcss'
      ],
      branch: 'feature/styles',
      permissions: {
        read: ['*'],
        write: ['src/styles/**', 'tailwind.config.js', '**/*.css', '**/*.scss'],
        execute: ['build:styles', 'optimize:css']
      }
    });

    this.preprocessor = 'css'; // css, sass, less
    this.framework = 'vanilla'; // vanilla, tailwind, bootstrap
  }

  async processTask(task) {
    switch (task.type) {
      case 'create_styles':
        return await this.createStyles(task.params);
      case 'create_animation':
        return await this.createAnimation(task.params);
      case 'setup_tailwind':
        return await this.setupTailwind(task.params);
      case 'optimize_css':
        return await this.optimizeCSS(task.params);
      case 'create_theme':
        return await this.createTheme(task.params);
      case 'responsive_layout':
        return await this.createResponsiveLayout(task.params);
      default:
        return await super.processTask(task);
    }
  }

  async createStyles(params) {
    const { component, styles, responsive = true } = params;
    
    const cssContent = await this.generateCSS(component, styles, responsive);
    const filePath = path.join(process.cwd(), 'src', 'styles', `${component}.css`);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, cssContent);
    
    return { success: true, file: filePath };
  }

  async generateCSS(component, styles, responsive) {
    let css = `/* ${component} Component Styles */\n\n`;
    
    // Base styles
    css += `.${component} {\n`;
    for (const [prop, value] of Object.entries(styles.base || {})) {
      css += `  ${this.camelToKebab(prop)}: ${value};\n`;
    }
    css += `}\n\n`;

    // Responsive styles
    if (responsive) {
      css += this.generateResponsiveStyles(component, styles);
    }

    // Animations
    if (styles.animations) {
      css += this.generateAnimations(styles.animations);
    }

    return css;
  }

  generateResponsiveStyles(component, styles) {
    let css = '';
    
    const breakpoints = {
      mobile: '640px',
      tablet: '768px',
      desktop: '1024px',
      wide: '1280px'
    };

    for (const [breakpoint, width] of Object.entries(breakpoints)) {
      if (styles[breakpoint]) {
        css += `@media (min-width: ${width}) {\n`;
        css += `  .${component} {\n`;
        for (const [prop, value] of Object.entries(styles[breakpoint])) {
          css += `    ${this.camelToKebab(prop)}: ${value};\n`;
        }
        css += `  }\n}\n\n`;
      }
    }

    return css;
  }

  generateAnimations(animations) {
    let css = '';
    
    for (const [name, keyframes] of Object.entries(animations)) {
      css += `@keyframes ${name} {\n`;
      for (const [step, props] of Object.entries(keyframes)) {
        css += `  ${step} {\n`;
        for (const [prop, value] of Object.entries(props)) {
          css += `    ${this.camelToKebab(prop)}: ${value};\n`;
        }
        css += `  }\n`;
      }
      css += `}\n\n`;
    }

    return css;
  }

  async createAnimation(params) {
    const { name, duration = '0.3s', easing = 'ease-in-out', keyframes } = params;
    
    const animationCSS = `
@keyframes ${name} {
  ${Object.entries(keyframes).map(([step, props]) => `
  ${step} {
    ${Object.entries(props).map(([prop, value]) => `${this.camelToKebab(prop)}: ${value};`).join('\n    ')}
  }`).join('\n')}
}

.animate-${name} {
  animation: ${name} ${duration} ${easing};
}

.animate-${name}-infinite {
  animation: ${name} ${duration} ${easing} infinite;
}`;

    const filePath = path.join(process.cwd(), 'src', 'styles', 'animations', `${name}.css`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, animationCSS);

    return { success: true, animation: name, file: filePath };
  }

  async setupTailwind(params = {}) {
    const { theme = {}, plugins = [] } = params;
    
    const config = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(theme.colors || {}, null, 4)},
      fontFamily: ${JSON.stringify(theme.fontFamily || {}, null, 4)},
      spacing: ${JSON.stringify(theme.spacing || {}, null, 4)},
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-soft': 'bounceSoft 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [${plugins.join(', ')}],
}`;

    await fs.writeFile(path.join(process.cwd(), 'tailwind.config.js'), config);

    // Create Tailwind CSS file
    const tailwindCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors;
  }
  
  .card {
    @apply p-6 bg-white rounded-lg shadow-md;
  }
  
  .container-responsive {
    @apply w-full px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl;
  }
}`;

    await fs.writeFile(path.join(process.cwd(), 'src', 'styles', 'tailwind.css'), tailwindCSS);

    return { success: true, framework: 'tailwind' };
  }

  async optimizeCSS(params) {
    const { inputFile, outputFile } = params;
    
    const css = await fs.readFile(inputFile, 'utf8');
    
    const result = await postcss([
      autoprefixer(),
      cssnano({
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
        }]
      })
    ]).process(css, { from: inputFile, to: outputFile });

    await fs.writeFile(outputFile, result.css);

    if (result.map) {
      await fs.writeFile(`${outputFile}.map`, result.map.toString());
    }

    return {
      success: true,
      originalSize: css.length,
      optimizedSize: result.css.length,
      reduction: Math.round((1 - result.css.length / css.length) * 100) + '%'
    };
  }

  async createTheme(params) {
    const { name = 'default', colors, mode = 'light' } = params;
    
    const theme = `:root[data-theme="${name}"] {
  /* Colors */
  --color-primary: ${colors?.primary || '#3B82F6'};
  --color-secondary: ${colors?.secondary || '#10B981'};
  --color-accent: ${colors?.accent || '#F59E0B'};
  --color-neutral: ${colors?.neutral || '#6B7280'};
  
  /* Background & Surface */
  --color-background: ${mode === 'light' ? '#FFFFFF' : '#0F172A'};
  --color-surface: ${mode === 'light' ? '#F9FAFB' : '#1E293B'};
  --color-surface-variant: ${mode === 'light' ? '#F3F4F6' : '#334155'};
  
  /* Text */
  --color-text: ${mode === 'light' ? '#1F2937' : '#F1F5F9'};
  --color-text-secondary: ${mode === 'light' ? '#6B7280' : '#94A3B8'};
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, ${mode === 'light' ? '0.05' : '0.2'});
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, ${mode === 'light' ? '0.1' : '0.3'});
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, ${mode === 'light' ? '0.1' : '0.4'});
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}`;

    const filePath = path.join(process.cwd(), 'src', 'styles', 'themes', `${name}.css`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, theme);

    return { success: true, theme: name, file: filePath };
  }

  async createResponsiveLayout(params) {
    const { type = 'grid', columns = 12, gap = '1rem' } = params;
    
    let layoutCSS = '';
    
    if (type === 'grid') {
      layoutCSS = `.grid-responsive {
  display: grid;
  gap: ${gap};
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 640px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(${columns}, 1fr);
  }
}

/* Span utilities */
${Array.from({ length: columns }, (_, i) => i + 1).map(span => `
.col-span-${span} {
  grid-column: span ${span} / span ${span};
}`).join('')}`;
    } else if (type === 'flex') {
      layoutCSS = `.flex-responsive {
  display: flex;
  flex-direction: column;
  gap: ${gap};
}

@media (min-width: 768px) {
  .flex-responsive {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.flex-item {
  flex: 1 1 100%;
}

@media (min-width: 640px) {
  .flex-item {
    flex: 1 1 calc(50% - ${gap});
  }
}

@media (min-width: 768px) {
  .flex-item {
    flex: 1 1 calc(33.333% - ${gap});
  }
}

@media (min-width: 1024px) {
  .flex-item {
    flex: 1 1 calc(25% - ${gap});
  }
}`;
    }

    const filePath = path.join(process.cwd(), 'src', 'styles', 'layouts', `${type}-layout.css`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, layoutCSS);

    return { success: true, layout: type, file: filePath };
  }

  camelToKebab(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }
}

module.exports = CSSStylingAgent;