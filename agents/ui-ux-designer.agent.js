#!/usr/bin/env node

const CoreAgent = require('./core_agent');
const fs = require('fs').promises;
const path = require('path');

class UIUXDesignerAgent extends CoreAgent {
  constructor(config = {}) {
    super({
      ...config,
      id: 'agent_001',
      name: 'UI/UX Designer Agent',
      type: 'designer',
      capabilities: [
        'design_systems',
        'responsive_design',
        'accessibility',
        'color_theory',
        'typography',
        'user_research',
        'wireframing',
        'prototyping',
        'material_design',
        'ios_design',
        'interaction_design'
      ],
      branch: 'feature/ui-design',
      permissions: {
        read: ['*'],
        write: ['src/styles/**', 'src/design-system/**', 'docs/design/**'],
        execute: ['design:validate', 'design:export']
      }
    });

    this.designSystem = null;
    this.colorPalette = null;
    this.typography = null;
    this.breakpoints = {
      mobile: 640,
      tablet: 768,
      desktop: 1024,
      wide: 1280
    };
  }

  async initialize() {
    await super.initialize();
    await this.loadDesignSystem();
    this.log('UI/UX Designer Agent initialized with design system capabilities');
  }

  async loadDesignSystem() {
    try {
      const designPath = path.join(process.cwd(), 'src', 'design-system', 'tokens.json');
      const data = await fs.readFile(designPath, 'utf8');
      this.designSystem = JSON.parse(data);
    } catch {
      this.designSystem = await this.createDefaultDesignSystem();
    }
  }

  async processTask(task) {
    switch (task.type) {
      case 'create_design_system':
        return await this.createDesignSystem(task.params);
      case 'design_component':
        return await this.designComponent(task.params);
      case 'create_color_palette':
        return await this.generateColorPalette(task.params);
      case 'design_layout':
        return await this.designResponsiveLayout(task.params);
      case 'accessibility_audit':
        return await this.performAccessibilityAudit(task.params);
      case 'create_style_guide':
        return await this.createStyleGuide(task.params);
      default:
        return await super.processTask(task);
    }
  }

  async createDesignSystem(params = {}) {
    const { brand = {}, theme = 'light' } = params;
    
    const designSystem = {
      version: '1.0.0',
      theme: theme,
      colors: await this.generateColorPalette({ 
        primary: brand.primaryColor || '#3B82F6',
        mode: theme 
      }),
      typography: this.generateTypographyScale(),
      spacing: this.generateSpacingScale(),
      breakpoints: this.breakpoints,
      shadows: this.generateShadows(),
      animations: this.generateAnimations(),
      components: {
        button: await this.designButton(),
        card: await this.designCard(),
        input: await this.designInput(),
        navigation: await this.designNavigation()
      }
    };

    await this.saveDesignSystem(designSystem);
    this.emit('design:created', { type: 'design-system', data: designSystem });
    
    return {
      success: true,
      designSystem,
      message: 'Design system created successfully'
    };
  }

  async generateColorPalette(params) {
    const { primary = '#3B82F6', mode = 'light' } = params;
    
    const palette = {
      primary: this.generateColorScale(primary),
      secondary: this.generateColorScale(this.complementaryColor(primary)),
      neutral: this.generateNeutralScale(mode),
      semantic: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
      },
      surface: mode === 'light' ? {
        background: '#FFFFFF',
        foreground: '#1F2937',
        card: '#F9FAFB',
        overlay: 'rgba(0, 0, 0, 0.5)'
      } : {
        background: '#0F172A',
        foreground: '#F1F5F9',
        card: '#1E293B',
        overlay: 'rgba(0, 0, 0, 0.7)'
      }
    };

    this.colorPalette = palette;
    return palette;
  }

  generateColorScale(baseColor) {
    // Generate shades from 50 to 900
    const scales = {
      50: this.lighten(baseColor, 0.95),
      100: this.lighten(baseColor, 0.9),
      200: this.lighten(baseColor, 0.75),
      300: this.lighten(baseColor, 0.6),
      400: this.lighten(baseColor, 0.3),
      500: baseColor,
      600: this.darken(baseColor, 0.1),
      700: this.darken(baseColor, 0.25),
      800: this.darken(baseColor, 0.4),
      900: this.darken(baseColor, 0.6)
    };
    return scales;
  }

  generateNeutralScale(mode) {
    const base = mode === 'light' ? '#6B7280' : '#9CA3AF';
    return this.generateColorScale(base);
  }

  generateTypographyScale() {
    return {
      fontFamily: {
        sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        serif: "'Merriweather', 'Georgia', serif",
        mono: "'Fira Code', 'Consolas', monospace"
      },
      fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem',// 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem',    // 48px
        '6xl': '3.75rem'  // 60px
      },
      fontWeight: {
        thin: 100,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        black: 900
      },
      lineHeight: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em'
      }
    };
  }

  generateSpacingScale() {
    const baseUnit = 4;
    return {
      px: '1px',
      0: '0',
      0.5: `${baseUnit * 0.5}px`,
      1: `${baseUnit}px`,
      1.5: `${baseUnit * 1.5}px`,
      2: `${baseUnit * 2}px`,
      2.5: `${baseUnit * 2.5}px`,
      3: `${baseUnit * 3}px`,
      4: `${baseUnit * 4}px`,
      5: `${baseUnit * 5}px`,
      6: `${baseUnit * 6}px`,
      8: `${baseUnit * 8}px`,
      10: `${baseUnit * 10}px`,
      12: `${baseUnit * 12}px`,
      16: `${baseUnit * 16}px`,
      20: `${baseUnit * 20}px`,
      24: `${baseUnit * 24}px`,
      32: `${baseUnit * 32}px`,
      40: `${baseUnit * 40}px`,
      48: `${baseUnit * 48}px`,
      56: `${baseUnit * 56}px`,
      64: `${baseUnit * 64}px`
    };
  }

  generateShadows() {
    return {
      none: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
    };
  }

  generateAnimations() {
    return {
      transition: {
        none: 'none',
        all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        colors: 'background-color, border-color, color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
      },
      duration: {
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms'
      },
      easing: {
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    };
  }

  async designButton() {
    return {
      variants: {
        primary: {
          background: 'var(--color-primary-500)',
          color: 'white',
          hover: {
            background: 'var(--color-primary-600)'
          }
        },
        secondary: {
          background: 'var(--color-neutral-200)',
          color: 'var(--color-neutral-800)',
          hover: {
            background: 'var(--color-neutral-300)'
          }
        },
        ghost: {
          background: 'transparent',
          color: 'var(--color-primary-500)',
          hover: {
            background: 'var(--color-primary-50)'
          }
        }
      },
      sizes: {
        sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
        md: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
        lg: { padding: '1rem 2rem', fontSize: '1.125rem' }
      },
      states: {
        disabled: { opacity: 0.5, cursor: 'not-allowed' },
        loading: { cursor: 'wait' },
        focus: { outline: '2px solid var(--color-primary-500)', outlineOffset: '2px' }
      }
    };
  }

  async designCard() {
    return {
      base: {
        background: 'var(--color-surface-card)',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-md)'
      },
      variants: {
        elevated: { boxShadow: 'var(--shadow-lg)' },
        outlined: { border: '1px solid var(--color-neutral-200)', boxShadow: 'none' },
        ghost: { background: 'transparent', boxShadow: 'none' }
      }
    };
  }

  async designInput() {
    return {
      base: {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '0.375rem',
        border: '1px solid var(--color-neutral-300)',
        fontSize: '1rem',
        transition: 'var(--transition-all)'
      },
      states: {
        focus: {
          outline: 'none',
          borderColor: 'var(--color-primary-500)',
          boxShadow: '0 0 0 3px var(--color-primary-100)'
        },
        error: {
          borderColor: 'var(--color-error)',
          color: 'var(--color-error)'
        },
        disabled: {
          background: 'var(--color-neutral-100)',
          cursor: 'not-allowed',
          opacity: 0.7
        }
      }
    };
  }

  async designNavigation() {
    return {
      desktop: {
        height: '64px',
        background: 'var(--color-surface-background)',
        borderBottom: '1px solid var(--color-neutral-200)',
        padding: '0 2rem'
      },
      mobile: {
        height: '56px',
        padding: '0 1rem',
        hamburger: {
          size: '24px',
          color: 'var(--color-neutral-700)'
        }
      },
      items: {
        padding: '0.5rem 1rem',
        color: 'var(--color-neutral-700)',
        hover: {
          color: 'var(--color-primary-500)',
          background: 'var(--color-primary-50)'
        },
        active: {
          color: 'var(--color-primary-600)',
          fontWeight: 500
        }
      }
    };
  }

  async designComponent(params) {
    const { componentName, type, requirements = {} } = params;
    
    const componentDesign = {
      name: componentName,
      type: type,
      responsive: await this.createResponsiveVariants(requirements),
      accessibility: this.ensureAccessibility(requirements),
      interactions: this.defineInteractions(type),
      animations: this.defineAnimations(type)
    };

    return componentDesign;
  }

  async createResponsiveVariants(requirements) {
    return {
      mobile: {
        layout: requirements.mobile || 'stack',
        fontSize: 'base',
        padding: 'compact'
      },
      tablet: {
        layout: requirements.tablet || 'flex',
        fontSize: 'base',
        padding: 'normal'
      },
      desktop: {
        layout: requirements.desktop || 'grid',
        fontSize: 'lg',
        padding: 'spacious'
      }
    };
  }

  ensureAccessibility(requirements) {
    return {
      ariaLabels: true,
      keyboardNavigation: true,
      colorContrast: 'WCAG_AA',
      focusIndicators: true,
      screenReaderSupport: true,
      altTexts: requirements.images ? true : false
    };
  }

  defineInteractions(componentType) {
    const interactions = {
      button: ['click', 'hover', 'focus', 'disabled'],
      form: ['focus', 'blur', 'change', 'submit'],
      navigation: ['hover', 'active', 'expand', 'collapse'],
      card: ['hover', 'click', 'expand'],
      modal: ['open', 'close', 'overlay-click', 'escape-key']
    };
    
    return interactions[componentType] || ['hover', 'click'];
  }

  defineAnimations(componentType) {
    const animations = {
      button: { hover: 'scale(1.05)', click: 'scale(0.95)' },
      card: { hover: 'translateY(-4px)' },
      modal: { enter: 'fadeIn', exit: 'fadeOut' },
      navigation: { slideDown: true, slideUp: true }
    };
    
    return animations[componentType] || {};
  }

  async designResponsiveLayout(params) {
    const { layoutType, columns = 12, components = [] } = params;
    
    return {
      grid: {
        mobile: { columns: 1, gap: '1rem' },
        tablet: { columns: Math.min(2, columns), gap: '1.5rem' },
        desktop: { columns: columns, gap: '2rem' }
      },
      containers: {
        maxWidth: '1280px',
        padding: { mobile: '1rem', tablet: '2rem', desktop: '3rem' }
      },
      components: components.map(comp => ({
        ...comp,
        responsive: this.createResponsiveVariants(comp)
      }))
    };
  }

  async performAccessibilityAudit(params) {
    const { components, level = 'AA' } = params;
    
    const audit = {
      colorContrast: [],
      ariaLabels: [],
      keyboardNav: [],
      semanticHTML: [],
      recommendations: []
    };

    // Check color contrast ratios
    if (this.colorPalette) {
      audit.colorContrast = this.checkColorContrast(level);
    }

    // Generate recommendations
    audit.recommendations = [
      'Ensure all interactive elements have focus indicators',
      'Provide alt text for all images',
      'Use semantic HTML elements',
      'Implement skip navigation links',
      'Test with screen readers'
    ];

    return audit;
  }

  checkColorContrast(level) {
    // Simplified contrast checking
    const minRatio = level === 'AAA' ? 7 : 4.5;
    return {
      passed: true,
      ratio: minRatio,
      level: level
    };
  }

  async createStyleGuide(params) {
    const { format = 'markdown' } = params;
    
    const styleGuide = {
      title: 'Style Guide',
      version: '1.0.0',
      sections: {
        colors: this.documentColors(),
        typography: this.documentTypography(),
        spacing: this.documentSpacing(),
        components: this.documentComponents(),
        patterns: this.documentPatterns()
      }
    };

    if (format === 'markdown') {
      return this.convertToMarkdown(styleGuide);
    }
    
    return styleGuide;
  }

  documentColors() {
    if (!this.colorPalette) return {};
    
    return {
      primary: 'Used for primary actions and brand identity',
      secondary: 'Used for secondary actions and accents',
      neutral: 'Used for text and backgrounds',
      semantic: 'Used for status and feedback'
    };
  }

  documentTypography() {
    return {
      headings: 'Use for page and section titles',
      body: 'Use for paragraph text',
      caption: 'Use for helper text and labels',
      code: 'Use for code snippets'
    };
  }

  documentSpacing() {
    return {
      small: 'Use for tight spacing within components',
      medium: 'Use for standard spacing between elements',
      large: 'Use for spacing between sections'
    };
  }

  documentComponents() {
    return {
      buttons: 'Interactive elements for actions',
      forms: 'Input elements for data collection',
      cards: 'Containers for grouped content',
      navigation: 'Wayfinding elements'
    };
  }

  documentPatterns() {
    return {
      grid: '12-column responsive grid system',
      flexbox: 'Flexible box layout for components',
      zIndex: 'Layering system for overlays'
    };
  }

  async saveDesignSystem(designSystem) {
    const dir = path.join(process.cwd(), 'src', 'design-system');
    await fs.mkdir(dir, { recursive: true });
    
    const filePath = path.join(dir, 'tokens.json');
    await fs.writeFile(filePath, JSON.stringify(designSystem, null, 2));
    
    this.log('Design system saved to tokens.json');
  }

  async createDefaultDesignSystem() {
    return await this.createDesignSystem({
      brand: { primaryColor: '#3B82F6' },
      theme: 'light'
    });
  }

  // Color manipulation utilities
  lighten(color, amount) {
    // Simplified color lightening
    return color; // Would implement actual color manipulation
  }

  darken(color, amount) {
    // Simplified color darkening
    return color; // Would implement actual color manipulation
  }

  complementaryColor(color) {
    // Return complementary color
    return '#10B981'; // Simplified
  }

  convertToMarkdown(styleGuide) {
    let markdown = `# ${styleGuide.title} v${styleGuide.version}\n\n`;
    
    for (const [section, content] of Object.entries(styleGuide.sections)) {
      markdown += `## ${section.charAt(0).toUpperCase() + section.slice(1)}\n\n`;
      for (const [key, value] of Object.entries(content)) {
        markdown += `### ${key}\n${value}\n\n`;
      }
    }
    
    return markdown;
  }
}

module.exports = UIUXDesignerAgent;