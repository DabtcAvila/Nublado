#!/usr/bin/env node

const CoreAgent = require('./core_agent');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class FrontendDeveloperAgent extends CoreAgent {
  constructor(config = {}) {
    super({
      ...config,
      id: 'agent_002',
      name: 'Frontend Developer Agent',
      type: 'developer',
      capabilities: [
        'react',
        'vue',
        'next.js',
        'typescript',
        'javascript',
        'component_architecture',
        'state_management',
        'routing',
        'hooks',
        'jsx',
        'tsx',
        'webpack',
        'vite'
      ],
      branch: 'feature/frontend',
      permissions: {
        read: ['*'],
        write: ['src/components/**', 'src/pages/**', 'src/hooks/**', 'src/utils/**'],
        execute: ['build:frontend', 'test:components', 'lint:fix']
      }
    });

    this.framework = 'react'; // Default framework
    this.buildTool = 'vite'; // Default build tool
    this.stateManagement = 'zustand'; // Default state management
    this.componentRegistry = new Map();
  }

  async initialize() {
    await super.initialize();
    await this.detectFramework();
    this.log(`Frontend Developer Agent initialized with ${this.framework} framework`);
  }

  async detectFramework() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = await fs.readFile(packagePath, 'utf8');
      const pkg = JSON.parse(packageData);
      
      if (pkg.dependencies?.react || pkg.devDependencies?.react) {
        this.framework = pkg.dependencies?.['next'] ? 'next.js' : 'react';
      } else if (pkg.dependencies?.vue || pkg.devDependencies?.vue) {
        this.framework = 'vue';
      }
      
      if (pkg.devDependencies?.vite) {
        this.buildTool = 'vite';
      } else if (pkg.devDependencies?.webpack) {
        this.buildTool = 'webpack';
      }
    } catch {
      // Use defaults if package.json doesn't exist
    }
  }

  async processTask(task) {
    switch (task.type) {
      case 'create_component':
        return await this.createComponent(task.params);
      case 'create_page':
        return await this.createPage(task.params);
      case 'setup_routing':
        return await this.setupRouting(task.params);
      case 'implement_state':
        return await this.implementStateManagement(task.params);
      case 'create_hook':
        return await this.createCustomHook(task.params);
      case 'optimize_bundle':
        return await this.optimizeBundle(task.params);
      case 'setup_project':
        return await this.setupProject(task.params);
      default:
        return await super.processTask(task);
    }
  }

  async createComponent(params) {
    const { 
      name, 
      type = 'functional', 
      props = [], 
      withStyles = true,
      withTests = true,
      responsive = true 
    } = params;

    const componentName = this.toPascalCase(name);
    const componentDir = path.join(process.cwd(), 'src', 'components', componentName);
    
    await fs.mkdir(componentDir, { recursive: true });

    // Generate component based on framework
    let componentCode;
    if (this.framework === 'react' || this.framework === 'next.js') {
      componentCode = await this.generateReactComponent(componentName, props, type, responsive);
    } else if (this.framework === 'vue') {
      componentCode = await this.generateVueComponent(componentName, props, responsive);
    }

    // Write component file
    const extension = this.framework === 'vue' ? 'vue' : 'jsx';
    const componentPath = path.join(componentDir, `${componentName}.${extension}`);
    await fs.writeFile(componentPath, componentCode);

    // Create styles if requested
    if (withStyles) {
      const styleCode = await this.generateComponentStyles(componentName, responsive);
      const stylePath = path.join(componentDir, `${componentName}.module.css`);
      await fs.writeFile(stylePath, styleCode);
    }

    // Create tests if requested
    if (withTests) {
      const testCode = await this.generateComponentTests(componentName, props);
      const testPath = path.join(componentDir, `${componentName}.test.js`);
      await fs.writeFile(testPath, testCode);
    }

    // Create index file for easier imports
    const indexCode = `export { default } from './${componentName}';\n`;
    await fs.writeFile(path.join(componentDir, 'index.js'), indexCode);

    // Register component
    this.componentRegistry.set(componentName, {
      path: componentDir,
      props,
      type,
      created: new Date()
    });

    this.emit('component:created', { name: componentName, path: componentDir });
    
    return {
      success: true,
      component: componentName,
      path: componentDir,
      files: [`${componentName}.${extension}`, 
               withStyles ? `${componentName}.module.css` : null,
               withTests ? `${componentName}.test.js` : null].filter(Boolean)
    };
  }

  async generateReactComponent(name, props, type, responsive) {
    const propsInterface = props.length > 0 
      ? `interface ${name}Props {\n${props.map(p => `  ${p.name}${p.required ? '' : '?'}: ${p.type || 'any'};\n`).join('')}}`
      : '';

    if (type === 'functional') {
      return `import React${props.some(p => p.type === 'children') ? ', { ReactNode }' : ''} from 'react';
${responsive ? "import { useMediaQuery } from '../hooks/useMediaQuery';" : ''}
import styles from './${name}.module.css';

${propsInterface}

const ${name}${propsInterface ? `: React.FC<${name}Props>` : ''} = (${props.length > 0 ? `{ ${props.map(p => p.name).join(', ')} }` : ''}) => {
  ${responsive ? `const isMobile = useMediaQuery('(max-width: 640px)');\n  const isTablet = useMediaQuery('(max-width: 768px)');\n` : ''}
  return (
    <div className={styles.container${responsive ? ` + ' ' + (isMobile ? styles.mobile : isTablet ? styles.tablet : styles.desktop)` : ''}}>
      <h2>${name} Component</h2>
      ${props.map(p => p.type === 'children' ? '{children}' : `<p>{${p.name}}</p>`).join('\n      ')}
    </div>
  );
};

export default ${name};`;
    } else if (type === 'class') {
      return `import React, { Component } from 'react';
import styles from './${name}.module.css';

${propsInterface}

interface ${name}State {
  loaded: boolean;
}

class ${name} extends Component<${name}Props, ${name}State> {
  constructor(props: ${name}Props) {
    super(props);
    this.state = {
      loaded: false
    };
  }

  componentDidMount() {
    this.setState({ loaded: true });
  }

  render() {
    const { ${props.map(p => p.name).join(', ')} } = this.props;
    const { loaded } = this.state;

    return (
      <div className={styles.container}>
        <h2>${name} Component</h2>
        {loaded && (
          <>
            ${props.map(p => `<p>{${p.name}}</p>`).join('\n            ')}
          </>
        )}
      </div>
    );
  }
}

export default ${name};`;
    }
  }

  async generateVueComponent(name, props, responsive) {
    return `<template>
  <div :class="containerClasses">
    <h2>${name} Component</h2>
    ${props.map(p => `<p>{{ ${p.name} }}</p>`).join('\n    ')}
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: '${name}',
  props: {
    ${props.map(p => `${p.name}: {
      type: ${this.getVuePropType(p.type)},
      ${p.required ? 'required: true' : 'default: null'}
    }`).join(',\n    ')}
  },
  ${responsive ? `data() {
    return {
      windowWidth: window.innerWidth
    };
  },
  computed: {
    containerClasses() {
      return {
        container: true,
        mobile: this.windowWidth <= 640,
        tablet: this.windowWidth <= 768 && this.windowWidth > 640,
        desktop: this.windowWidth > 768
      };
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth;
    }
  }` : ''}
};
</script>

<style module>
.container {
  padding: 1rem;
}

${responsive ? `.mobile {
  padding: 0.5rem;
}

.tablet {
  padding: 0.75rem;
}

.desktop {
  padding: 1.5rem;
}` : ''}
</style>`;
  }

  async generateComponentStyles(name, responsive) {
    return `.container {
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--color-surface);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.container h2 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.container p {
  margin: 0.5rem 0;
  color: var(--color-text);
}

${responsive ? `/* Mobile styles */
@media (max-width: 640px) {
  .mobile {
    padding: 0.75rem;
  }
  
  .mobile h2 {
    font-size: 1.25rem;
  }
}

/* Tablet styles */
@media (min-width: 641px) and (max-width: 768px) {
  .tablet {
    padding: 1rem;
  }
  
  .tablet h2 {
    font-size: 1.375rem;
  }
}

/* Desktop styles */
@media (min-width: 769px) {
  .desktop {
    padding: 1.5rem;
  }
  
  .desktop h2 {
    font-size: 1.75rem;
  }
}` : ''}`;
  }

  async generateComponentTests(name, props) {
    if (this.framework === 'react' || this.framework === 'next.js') {
      return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${name} from './${name}';

describe('${name} Component', () => {
  test('renders ${name} component', () => {
    render(<${name} ${props.map(p => `${p.name}="${p.type === 'string' ? 'test' : p.type === 'number' ? '123' : 'true'}"`).join(' ')} />);
    const heading = screen.getByText('${name} Component');
    expect(heading).toBeInTheDocument();
  });

  ${props.map(p => `test('displays ${p.name} prop', () => {
    const testValue = ${p.type === 'string' ? "'Test Value'" : p.type === 'number' ? '123' : 'true'};
    render(<${name} ${p.name}={testValue} />);
    const element = screen.getByText(testValue${p.type === 'number' || p.type === 'boolean' ? '.toString()' : ''});
    expect(element).toBeInTheDocument();
  });`).join('\n\n  ')}

  test('applies correct CSS classes', () => {
    const { container } = render(<${name} />);
    const element = container.firstChild;
    expect(element).toHaveClass('container');
  });
});`;
    } else if (this.framework === 'vue') {
      return `import { mount } from '@vue/test-utils';
import ${name} from './${name}.vue';

describe('${name} Component', () => {
  test('renders ${name} component', () => {
    const wrapper = mount(${name}, {
      props: {
        ${props.map(p => `${p.name}: ${p.type === 'string' ? "'test'" : p.type === 'number' ? '123' : 'true'}`).join(',\n        ')}
      }
    });
    expect(wrapper.text()).toContain('${name} Component');
  });

  ${props.map(p => `test('displays ${p.name} prop', () => {
    const testValue = ${p.type === 'string' ? "'Test Value'" : p.type === 'number' ? '123' : 'true'};
    const wrapper = mount(${name}, {
      props: { ${p.name}: testValue }
    });
    expect(wrapper.text()).toContain(testValue${p.type === 'number' || p.type === 'boolean' ? '.toString()' : ''});
  });`).join('\n\n  ')}
});`;
    }
  }

  async createPage(params) {
    const { name, route, withLayout = true, withSEO = true } = params;
    
    const pageName = this.toPascalCase(name);
    const pageDir = path.join(process.cwd(), 'src', 'pages');
    await fs.mkdir(pageDir, { recursive: true });

    let pageCode;
    if (this.framework === 'next.js') {
      pageCode = await this.generateNextPage(pageName, route, withSEO);
      const pagePath = path.join(pageDir, `${route || name.toLowerCase()}.js`);
      await fs.writeFile(pagePath, pageCode);
    } else {
      pageCode = await this.generateReactPage(pageName, withLayout, withSEO);
      const pagePath = path.join(pageDir, `${pageName}.jsx`);
      await fs.writeFile(pagePath, pageCode);
    }

    return {
      success: true,
      page: pageName,
      route: route || `/${name.toLowerCase()}`
    };
  }

  async generateNextPage(name, route, withSEO) {
    return `import Head from 'next/head';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function ${name}Page({ data }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Page initialization
    setLoading(false);
  }, []);

  return (
    <>
      ${withSEO ? `<Head>
        <title>${name} | Your Site</title>
        <meta name="description" content="${name} page description" />
        <meta property="og:title" content="${name}" />
        <meta property="og:description" content="${name} page description" />
      </Head>` : ''}
      
      <Layout>
        <div className="container">
          <h1>${name}</h1>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div>
              {/* Page content goes here */}
              <p>Welcome to ${name} page</p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

export async function getServerSideProps(context) {
  // Fetch data for the page
  const data = {};
  
  return {
    props: {
      data,
    },
  };
}`;
  }

  async generateReactPage(name, withLayout, withSEO) {
    return `import React, { useState, useEffect } from 'react';
${withSEO ? "import { Helmet } from 'react-helmet';" : ''}
${withLayout ? "import Layout from '../components/Layout';" : ''}
import './pages.css';

const ${name}Page = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch page data
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      // API call here
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const content = (
    <div className="page-container">
      ${withSEO ? `<Helmet>
        <title>${name} | Your Site</title>
        <meta name="description" content="${name} page description" />
      </Helmet>` : ''}
      
      <h1>${name}</h1>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="page-content">
          {/* Page content goes here */}
          <p>Welcome to ${name} page</p>
        </div>
      )}
    </div>
  );

  return ${withLayout ? '<Layout>{content}</Layout>' : 'content'};
};

export default ${name}Page;`;
  }

  async setupRouting(params) {
    const { routes = [], type = 'react-router' } = params;
    
    if (type === 'react-router') {
      return await this.setupReactRouter(routes);
    } else if (type === 'vue-router') {
      return await this.setupVueRouter(routes);
    }
  }

  async setupReactRouter(routes) {
    const routerCode = `import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Import pages
${routes.map(r => `import ${this.toPascalCase(r.name)}Page from './pages/${this.toPascalCase(r.name)}';`).join('\n')}

const AppRouter = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          ${routes.map(r => `<Route path="${r.path}" element={<${this.toPascalCase(r.name)}Page />} />`).join('\n          ')}
          <Route path="/" element={<Navigate to="${routes[0]?.path || '/home'}" />} />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default AppRouter;`;

    const routerPath = path.join(process.cwd(), 'src', 'Router.jsx');
    await fs.writeFile(routerPath, routerCode);

    return {
      success: true,
      router: 'React Router',
      routes: routes.length
    };
  }

  async setupVueRouter(routes) {
    const routerCode = `import { createRouter, createWebHistory } from 'vue-router';

// Import pages
${routes.map(r => `import ${this.toPascalCase(r.name)}Page from './pages/${this.toPascalCase(r.name)}.vue';`).join('\n')}

const routes = [
  ${routes.map(r => `{
    path: '${r.path}',
    name: '${r.name}',
    component: ${this.toPascalCase(r.name)}Page
  }`).join(',\n  ')},
  {
    path: '/',
    redirect: '${routes[0]?.path || '/home'}'
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('./pages/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;`;

    const routerPath = path.join(process.cwd(), 'src', 'router.js');
    await fs.writeFile(routerPath, routerCode);

    return {
      success: true,
      router: 'Vue Router',
      routes: routes.length
    };
  }

  async implementStateManagement(params) {
    const { type = 'zustand', stores = [] } = params;
    
    if (type === 'zustand') {
      return await this.setupZustand(stores);
    } else if (type === 'redux') {
      return await this.setupRedux(stores);
    } else if (type === 'pinia') {
      return await this.setupPinia(stores);
    }
  }

  async setupZustand(stores) {
    const storeDir = path.join(process.cwd(), 'src', 'store');
    await fs.mkdir(storeDir, { recursive: true });

    for (const store of stores) {
      const storeCode = `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const use${this.toPascalCase(store.name)}Store = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        ${store.state?.map(s => `${s.name}: ${JSON.stringify(s.initial)},`).join('\n        ') || ''}
        
        // Actions
        ${store.actions?.map(a => `${a.name}: (${a.params || ''}) => set((state) => ({
          // Implement ${a.name} logic
          ${a.updates?.map(u => `${u}: state.${u}`).join(',\n          ') || ''}
        })),`).join('\n        ') || ''}
        
        // Computed
        ${store.computed?.map(c => `get${this.toPascalCase(c.name)}: () => {
          const state = get();
          return state.${c.from};
        },`).join('\n        ') || ''}
      }),
      {
        name: '${store.name}-storage',
      }
    )
  )
);

export default use${this.toPascalCase(store.name)}Store;`;

      const storePath = path.join(storeDir, `${store.name}Store.js`);
      await fs.writeFile(storePath, storeCode);
    }

    return {
      success: true,
      stateManagement: 'Zustand',
      stores: stores.map(s => s.name)
    };
  }

  async setupRedux(stores) {
    const storeDir = path.join(process.cwd(), 'src', 'store');
    await fs.mkdir(path.join(storeDir, 'slices'), { recursive: true });

    // Create slices
    for (const store of stores) {
      const sliceCode = `import { createSlice } from '@reduxjs/toolkit';

const initial${this.toPascalCase(store.name)}State = {
  ${store.state?.map(s => `${s.name}: ${JSON.stringify(s.initial)}`).join(',\n  ') || ''}
};

const ${store.name}Slice = createSlice({
  name: '${store.name}',
  initialState: initial${this.toPascalCase(store.name)}State,
  reducers: {
    ${store.actions?.map(a => `${a.name}: (state, action) => {
      // Implement ${a.name} logic
      ${a.updates?.map(u => `state.${u} = action.payload.${u};`).join('\n      ') || ''}
    }`).join(',\n    ') || ''}
  }
});

export const { ${store.actions?.map(a => a.name).join(', ') || ''} } = ${store.name}Slice.actions;
export default ${store.name}Slice.reducer;`;

      const slicePath = path.join(storeDir, 'slices', `${store.name}Slice.js`);
      await fs.writeFile(slicePath, sliceCode);
    }

    // Create store configuration
    const storeConfig = `import { configureStore } from '@reduxjs/toolkit';
${stores.map(s => `import ${s.name}Reducer from './slices/${s.name}Slice';`).join('\n')}

export const store = configureStore({
  reducer: {
    ${stores.map(s => `${s.name}: ${s.name}Reducer`).join(',\n    ')}
  }
});

export default store;`;

    await fs.writeFile(path.join(storeDir, 'index.js'), storeConfig);

    return {
      success: true,
      stateManagement: 'Redux Toolkit',
      stores: stores.map(s => s.name)
    };
  }

  async setupPinia(stores) {
    const storeDir = path.join(process.cwd(), 'src', 'stores');
    await fs.mkdir(storeDir, { recursive: true });

    for (const store of stores) {
      const storeCode = `import { defineStore } from 'pinia';

export const use${this.toPascalCase(store.name)}Store = defineStore('${store.name}', {
  state: () => ({
    ${store.state?.map(s => `${s.name}: ${JSON.stringify(s.initial)}`).join(',\n    ') || ''}
  }),
  
  getters: {
    ${store.computed?.map(c => `${c.name}(state) {
      return state.${c.from};
    }`).join(',\n    ') || ''}
  },
  
  actions: {
    ${store.actions?.map(a => `${a.name}(${a.params || ''}) {
      // Implement ${a.name} logic
      ${a.updates?.map(u => `this.${u} = ${u};`).join('\n      ') || ''}
    }`).join(',\n    ') || ''}
  }
});`;

      const storePath = path.join(storeDir, `${store.name}.js`);
      await fs.writeFile(storePath, storeCode);
    }

    return {
      success: true,
      stateManagement: 'Pinia',
      stores: stores.map(s => s.name)
    };
  }

  async createCustomHook(params) {
    const { name, dependencies = [], returnValue } = params;
    
    const hookName = name.startsWith('use') ? name : `use${this.toPascalCase(name)}`;
    const hooksDir = path.join(process.cwd(), 'src', 'hooks');
    await fs.mkdir(hooksDir, { recursive: true });

    const hookCode = `import { useState, useEffect${dependencies.includes('useCallback') ? ', useCallback' : ''}${dependencies.includes('useMemo') ? ', useMemo' : ''}${dependencies.includes('useRef') ? ', useRef' : ''} } from 'react';

/**
 * Custom hook: ${hookName}
 * ${params.description || 'Custom hook implementation'}
 */
const ${hookName} = (${params.params?.map(p => p.name).join(', ') || ''}) => {
  const [state, setState] = useState(${JSON.stringify(params.initialState || null)});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Hook logic here
    ${params.effect || '// Add your effect logic'}
    
    return () => {
      // Cleanup
      ${params.cleanup || '// Add cleanup logic if needed'}
    };
  }, [${params.deps?.join(', ') || ''}]);

  ${params.methods?.map(m => `const ${m.name} = ${m.async ? 'async ' : ''}(${m.params || ''}) => {
    ${m.async ? 'setLoading(true);\n    try {' : ''}
    ${m.body || '// Method implementation'}
    ${m.async ? `} catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }` : ''}
  };`).join('\n\n  ') || ''}

  return ${returnValue || '{ state, loading, error, setState }'};
};

export default ${hookName};`;

    const hookPath = path.join(hooksDir, `${hookName}.js`);
    await fs.writeFile(hookPath, hookCode);

    // Create test for the hook
    const testCode = `import { renderHook, act } from '@testing-library/react-hooks';
import ${hookName} from './${hookName}';

describe('${hookName}', () => {
  test('should initialize with default state', () => {
    const { result } = renderHook(() => ${hookName}());
    expect(result.current.state).toBe(${JSON.stringify(params.initialState || null)});
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  ${params.methods?.map(m => `test('should handle ${m.name}', async () => {
    const { result } = renderHook(() => ${hookName}());
    
    await act(async () => {
      ${m.async ? 'await ' : ''}result.current.${m.name}();
    });
    
    // Add assertions here
  });`).join('\n\n  ') || ''}
});`;

    const testPath = path.join(hooksDir, `${hookName}.test.js`);
    await fs.writeFile(testPath, testCode);

    return {
      success: true,
      hook: hookName,
      path: hookPath
    };
  }

  async optimizeBundle(params) {
    const { analyze = false, splitChunks = true, treeshake = true } = params;
    
    let configCode;
    if (this.buildTool === 'vite') {
      configCode = await this.generateViteConfig({ analyze, splitChunks, treeshake });
    } else {
      configCode = await this.generateWebpackConfig({ analyze, splitChunks, treeshake });
    }

    const configPath = path.join(process.cwd(), 
      this.buildTool === 'vite' ? 'vite.config.js' : 'webpack.config.js'
    );
    await fs.writeFile(configPath, configCode);

    if (analyze) {
      await this.runBundleAnalyzer();
    }

    return {
      success: true,
      buildTool: this.buildTool,
      optimizations: { splitChunks, treeshake }
    };
  }

  async generateViteConfig(options) {
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';
${options.analyze ? "import { visualizer } from 'rollup-plugin-visualizer';" : ''}

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    ${options.analyze ? `visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),` : ''}
  ],
  build: {
    ${options.splitChunks ? `rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'axios'],
        },
      },
    },` : ''}
    ${options.treeshake ? 'treeshake: true,' : ''}
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});`;
  }

  async generateWebpackConfig(options) {
    return `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
${options.analyze ? "const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;" : ''}

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CompressionPlugin({
      algorithm: 'gzip',
    }),
    ${options.analyze ? 'new BundleAnalyzerPlugin(),' : ''}
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
    })],
    ${options.splitChunks ? `splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          priority: 10,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },` : ''}
    ${options.treeshake ? 'usedExports: true,\n    sideEffects: false,' : ''}
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};`;
  }

  async runBundleAnalyzer() {
    try {
      await execAsync(`npm run build -- --analyze`);
      this.log('Bundle analysis complete');
    } catch (error) {
      this.log(`Bundle analysis failed: ${error.message}`, 'warn');
    }
  }

  async setupProject(params) {
    const { name, framework = 'react', features = [] } = params;
    
    // Initialize project
    const projectDir = path.join(process.cwd(), name);
    await fs.mkdir(projectDir, { recursive: true });

    // Create package.json
    const packageJson = {
      name: name.toLowerCase(),
      version: '1.0.0',
      private: true,
      scripts: {
        dev: framework === 'next.js' ? 'next dev' : 'vite',
        build: framework === 'next.js' ? 'next build' : 'vite build',
        start: framework === 'next.js' ? 'next start' : 'vite preview',
        test: 'jest',
        lint: 'eslint . --ext .js,.jsx,.ts,.tsx',
      },
      dependencies: this.getProjectDependencies(framework, features),
      devDependencies: this.getProjectDevDependencies(framework, features),
    };

    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create project structure
    await this.createProjectStructure(projectDir, framework);

    // Setup features
    for (const feature of features) {
      await this.setupFeature(projectDir, feature);
    }

    return {
      success: true,
      project: name,
      framework,
      features
    };
  }

  getProjectDependencies(framework, features) {
    const deps = {};
    
    if (framework === 'react' || framework === 'next.js') {
      deps.react = '^18.2.0';
      deps['react-dom'] = '^18.2.0';
    }
    
    if (framework === 'next.js') {
      deps.next = '^13.5.0';
    }
    
    if (framework === 'vue') {
      deps.vue = '^3.3.0';
    }
    
    if (features.includes('routing')) {
      if (framework === 'react') {
        deps['react-router-dom'] = '^6.15.0';
      } else if (framework === 'vue') {
        deps['vue-router'] = '^4.2.0';
      }
    }
    
    if (features.includes('state')) {
      if (framework === 'react' || framework === 'next.js') {
        deps.zustand = '^4.4.0';
      } else if (framework === 'vue') {
        deps.pinia = '^2.1.0';
      }
    }
    
    return deps;
  }

  getProjectDevDependencies(framework, features) {
    const devDeps = {};
    
    if (framework === 'react' || framework === 'next.js') {
      devDeps['@types/react'] = '^18.2.0';
      devDeps['@types/react-dom'] = '^18.2.0';
    }
    
    if (framework !== 'next.js') {
      devDeps.vite = '^4.4.0';
      if (framework === 'react') {
        devDeps['@vitejs/plugin-react'] = '^4.0.0';
      } else if (framework === 'vue') {
        devDeps['@vitejs/plugin-vue'] = '^4.3.0';
      }
    }
    
    devDeps.eslint = '^8.48.0';
    devDeps.prettier = '^3.0.0';
    devDeps.jest = '^29.6.0';
    devDeps['@testing-library/react'] = '^14.0.0';
    devDeps['@testing-library/jest-dom'] = '^6.1.0';
    
    return devDeps;
  }

  async createProjectStructure(projectDir, framework) {
    const dirs = [
      'src',
      'src/components',
      'src/pages',
      'src/hooks',
      'src/utils',
      'src/styles',
      'src/store',
      'public',
      'tests',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(projectDir, dir), { recursive: true });
    }

    // Create index file
    let indexContent;
    if (framework === 'react') {
      indexContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
    } else if (framework === 'vue') {
      indexContent = `import { createApp } from 'vue';
import App from './App.vue';
import './styles/index.css';

createApp(App).mount('#app');`;
    }

    if (indexContent) {
      await fs.writeFile(
        path.join(projectDir, 'src', framework === 'vue' ? 'main.js' : 'index.js'),
        indexContent
      );
    }
  }

  async setupFeature(projectDir, feature) {
    switch (feature) {
      case 'typescript':
        await this.setupTypeScript(projectDir);
        break;
      case 'testing':
        await this.setupTesting(projectDir);
        break;
      case 'styling':
        await this.setupStyling(projectDir);
        break;
      case 'pwa':
        await this.setupPWA(projectDir);
        break;
    }
  }

  async setupTypeScript(projectDir) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }],
    };

    await fs.writeFile(
      path.join(projectDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  async setupTesting(projectDir) {
    const jestConfig = {
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
      },
      collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.js',
      ],
    };

    await fs.writeFile(
      path.join(projectDir, 'jest.config.js'),
      `module.exports = ${JSON.stringify(jestConfig, null, 2)};`
    );

    // Create test setup file
    const setupCode = `import '@testing-library/jest-dom';

// Add any global test setup here`;

    await fs.writeFile(path.join(projectDir, 'tests', 'setup.js'), setupCode);
  }

  async setupStyling(projectDir) {
    // PostCSS config
    const postCssConfig = {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    };

    await fs.writeFile(
      path.join(projectDir, 'postcss.config.js'),
      `module.exports = ${JSON.stringify(postCssConfig, null, 2)};`
    );

    // Tailwind config
    const tailwindConfig = `module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};`;

    await fs.writeFile(path.join(projectDir, 'tailwind.config.js'), tailwindConfig);

    // Global styles
    const globalStyles = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #3B82F6;
  --color-secondary: #10B981;
  --color-text: #1F2937;
  --color-background: #FFFFFF;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;

    await fs.writeFile(path.join(projectDir, 'src', 'styles', 'index.css'), globalStyles);
  }

  async setupPWA(projectDir) {
    const manifest = {
      name: 'App Name',
      short_name: 'App',
      description: 'App description',
      theme_color: '#3B82F6',
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    };

    await fs.writeFile(
      path.join(projectDir, 'public', 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Service worker
    const swCode = `self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated.');
});

self.addEventListener('fetch', (event) => {
  // Add caching strategy here
});`;

    await fs.writeFile(path.join(projectDir, 'public', 'service-worker.js'), swCode);
  }

  // Utility methods
  toPascalCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toUpperCase() : word.toUpperCase();
    }).replace(/[\s-_]+/g, '');
  }

  getVuePropType(type) {
    const typeMap = {
      string: 'String',
      number: 'Number',
      boolean: 'Boolean',
      array: 'Array',
      object: 'Object',
      function: 'Function',
    };
    return typeMap[type] || 'String';
  }
}

module.exports = FrontendDeveloperAgent;