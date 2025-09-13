#!/usr/bin/env node

const CoreAgent = require('./core_agent');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class GitHubSparkSpecialistAgent extends CoreAgent {
  constructor(config = {}) {
    super({
      ...config,
      id: 'agent_011',
      name: 'GitHub Spark Specialist Agent',
      type: 'spark_specialist',
      capabilities: [
        'github_spark',
        'natural_language_development',
        'micro_apps',
        'pwa_deployment',
        'ai_integration',
        'spark_sdk',
        'prompt_engineering',
        'rapid_prototyping',
        'no_code_development',
        'claude_sonnet_integration',
        'github_models',
        'spark_cli'
      ],
      branch: 'feature/spark-integration',
      permissions: {
        read: ['*'],
        write: ['src/sparks/**', 'sparks/**', '.spark/**'],
        execute: ['spark:create', 'spark:deploy', 'spark:test']
      }
    });

    this.sparkContext = {
      model: 'Claude Sonnet 4',
      runtime: 'integrated',
      deployment: 'pwa',
      authenticated: false
    };

    this.bestPractices = this.loadBestPractices();
  }

  async initialize() {
    await super.initialize();
    await this.checkSparkAvailability();
    this.log('GitHub Spark Specialist Agent initialized with AI-powered micro-app capabilities');
  }

  loadBestPractices() {
    return {
      prompting: {
        specificity: 'Be extremely specific about behaviors and interactions',
        context: 'Include mockups, specifications, and scenarios',
        relevance: 'Keep prompts relevant to the application being built',
        iteration: 'Use iterative refinement for complex applications',
        testing: 'Always verify behavior through preview before deployment'
      },
      development: {
        framework: 'TypeScript and React are natively supported',
        ai_integration: 'Use Spark SDK for GitHub Models integration',
        components: 'Leverage built-in UI components and themeable design system',
        data: 'Utilize included data storage and LLM inference',
        auth: 'GitHub auth is included out-of-the-box'
      },
      deployment: {
        pwa: 'Apps are PWA-enabled for mobile and desktop',
        instant: 'One-click deployment with automatic hosting',
        permissions: 'Configure visibility (public, team, organization, private)',
        sync: 'Changes auto-deploy and sync across devices'
      },
      limitations: {
        subscription: 'Requires Copilot Pro+ ($39/month)',
        model: 'Currently uses Claude Sonnet 4 (subject to change)',
        scope: 'Best for micro-apps and prototypes',
        complexity: 'May struggle with very complex enterprise applications'
      }
    };
  }

  async processTask(task) {
    switch (task.type) {
      case 'create_spark_app':
        return await this.createSparkApp(task.params);
      case 'optimize_prompt':
        return await this.optimizePrompt(task.params);
      case 'integrate_ai_features':
        return await this.integrateAIFeatures(task.params);
      case 'deploy_spark':
        return await this.deploySpark(task.params);
      case 'analyze_use_case':
        return await this.analyzeUseCase(task.params);
      case 'generate_spark_code':
        return await this.generateSparkCode(task.params);
      case 'migrate_to_spark':
        return await this.migrateToSpark(task.params);
      default:
        return await super.processTask(task);
    }
  }

  async checkSparkAvailability() {
    // Check if user has Copilot Pro+ subscription
    // This would normally check GitHub API, but for now we'll simulate
    try {
      const { stdout } = await execAsync('gh auth status');
      this.sparkContext.authenticated = stdout.includes('Logged in');
      
      if (this.sparkContext.authenticated) {
        // Check for Copilot Pro+ subscription
        const { stdout: copilotStatus } = await execAsync('gh copilot status').catch(() => ({ stdout: '' }));
        this.sparkContext.hasProPlus = copilotStatus.includes('Pro+') || copilotStatus.includes('Pro Plus');
      }
    } catch (error) {
      this.log('GitHub CLI not authenticated. Some Spark features may be limited.', 'warn');
    }
  }

  async createSparkApp(params) {
    const { idea, features = [], type = 'micro-app' } = params;
    
    // Generate optimized prompt for Spark
    const optimizedPrompt = await this.generateOptimizedPrompt(idea, features);
    
    // Create Spark configuration
    const sparkConfig = {
      name: params.name || this.generateAppName(idea),
      description: idea,
      prompt: optimizedPrompt,
      settings: {
        framework: 'react-typescript',
        theme: params.theme || 'light',
        aiFeatures: features.includes('ai'),
        dataStorage: features.includes('database'),
        authentication: features.includes('auth')
      }
    };

    // Generate Spark app structure
    const appStructure = await this.generateSparkStructure(sparkConfig);
    
    // Save Spark configuration
    const sparkDir = path.join(process.cwd(), 'sparks', sparkConfig.name);
    await fs.mkdir(sparkDir, { recursive: true });
    
    await fs.writeFile(
      path.join(sparkDir, 'spark.config.json'),
      JSON.stringify(sparkConfig, null, 2)
    );

    // Generate initial code if not using Spark UI
    if (params.generateCode) {
      await this.generateInitialCode(sparkDir, sparkConfig);
    }

    return {
      success: true,
      app: sparkConfig.name,
      prompt: optimizedPrompt,
      structure: appStructure,
      recommendation: this.getRecommendation(type, features)
    };
  }

  async generateOptimizedPrompt(idea, features) {
    const featurePrompts = {
      ai: 'Include AI-powered features using GitHub Models SDK for intelligent interactions',
      database: 'Add persistent data storage with CRUD operations',
      auth: 'Implement GitHub authentication for user management',
      realtime: 'Enable real-time updates and live collaboration',
      mobile: 'Optimize for mobile devices with touch interactions and responsive design',
      offline: 'Add offline support with service workers and local caching',
      analytics: 'Include analytics tracking and usage metrics',
      payments: 'Integrate payment processing capabilities'
    };

    let prompt = `Create a ${idea}.\n\n`;
    prompt += `Technical Requirements:\n`;
    prompt += `- Built with TypeScript and React\n`;
    prompt += `- PWA-enabled for mobile and desktop\n`;
    prompt += `- Clean, modern UI with themeable design\n`;
    
    if (features.length > 0) {
      prompt += `\nFeatures to include:\n`;
      features.forEach(feature => {
        if (featurePrompts[feature]) {
          prompt += `- ${featurePrompts[feature]}\n`;
        }
      });
    }

    prompt += `\nBest Practices:\n`;
    prompt += `- Implement proper error handling and loading states\n`;
    prompt += `- Ensure accessibility with ARIA labels and keyboard navigation\n`;
    prompt += `- Use semantic HTML and responsive design\n`;
    prompt += `- Include helpful user feedback and tooltips\n`;

    return prompt;
  }

  async generateSparkStructure(config) {
    return {
      root: config.name,
      structure: {
        'spark.config.json': 'Spark configuration file',
        'app.tsx': 'Main application component',
        'components/': {
          'Header.tsx': 'App header with navigation',
          'MainContent.tsx': 'Primary content area',
          'Sidebar.tsx': 'Optional sidebar for additional features'
        },
        'hooks/': {
          'useSparkAI.ts': 'Hook for AI integrations',
          'useData.ts': 'Data management hook'
        },
        'styles/': {
          'theme.css': 'Themeable styles',
          'components.css': 'Component-specific styles'
        },
        'lib/': {
          'spark-sdk.ts': 'Spark SDK integrations',
          'github-models.ts': 'GitHub Models API wrapper'
        }
      }
    };
  }

  async optimizePrompt(params) {
    const { prompt, context = {} } = params;
    
    // Analyze prompt for improvements
    const analysis = {
      specificity: this.analyzeSpecificity(prompt),
      clarity: this.analyzeClarity(prompt),
      completeness: this.analyzeCompleteness(prompt, context),
      improvements: []
    };

    // Generate improvements
    if (analysis.specificity < 0.7) {
      analysis.improvements.push({
        type: 'specificity',
        suggestion: 'Add more specific details about UI components, user interactions, and data flow',
        example: 'Instead of "create a form", specify "create a contact form with name, email, and message fields, with validation and submit to email"'
      });
    }

    if (analysis.clarity < 0.8) {
      analysis.improvements.push({
        type: 'clarity',
        suggestion: 'Break down complex requirements into clear, sequential steps',
        example: 'List each feature separately with clear acceptance criteria'
      });
    }

    // Generate optimized version
    const optimized = await this.rewritePrompt(prompt, analysis.improvements);

    return {
      original: prompt,
      optimized,
      analysis,
      score: (analysis.specificity + analysis.clarity + analysis.completeness) / 3
    };
  }

  analyzeSpecificity(prompt) {
    const specificKeywords = [
      'button', 'form', 'input', 'display', 'show', 'hide', 'click',
      'submit', 'validate', 'error', 'success', 'loading', 'api',
      'database', 'user', 'authentication', 'responsive', 'mobile'
    ];
    
    const words = prompt.toLowerCase().split(/\s+/);
    const specificCount = words.filter(word => specificKeywords.includes(word)).length;
    
    return Math.min(specificCount / 10, 1); // Score from 0 to 1
  }

  analyzeClarity(prompt) {
    // Check for clear structure and organization
    const hasStructure = prompt.includes('\n') || prompt.includes('-') || prompt.includes('•');
    const hasNumbers = /\d\./.test(prompt);
    const sentenceLength = prompt.split('.').map(s => s.split(' ').length);
    const avgSentenceLength = sentenceLength.reduce((a, b) => a + b, 0) / sentenceLength.length;
    
    let score = 0.5;
    if (hasStructure) score += 0.2;
    if (hasNumbers) score += 0.1;
    if (avgSentenceLength < 20) score += 0.2;
    
    return Math.min(score, 1);
  }

  analyzeCompleteness(prompt, context) {
    const requiredElements = [
      'what', // What should the app do
      'who',  // Who is the user
      'how',  // How should it work
      'ui',   // UI/UX considerations
      'data'  // Data handling
    ];
    
    let score = 0;
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('app') || lowerPrompt.includes('create') || lowerPrompt.includes('build')) {
      score += 0.2; // Has 'what'
    }
    if (lowerPrompt.includes('user') || lowerPrompt.includes('people') || lowerPrompt.includes('customer')) {
      score += 0.2; // Has 'who'
    }
    if (lowerPrompt.includes('when') || lowerPrompt.includes('click') || lowerPrompt.includes('submit')) {
      score += 0.2; // Has 'how'
    }
    if (lowerPrompt.includes('design') || lowerPrompt.includes('ui') || lowerPrompt.includes('layout')) {
      score += 0.2; // Has 'ui'
    }
    if (lowerPrompt.includes('save') || lowerPrompt.includes('store') || lowerPrompt.includes('data')) {
      score += 0.2; // Has 'data'
    }
    
    return score;
  }

  async rewritePrompt(original, improvements) {
    let optimized = original;
    
    // Add structure if missing
    if (!original.includes('\n')) {
      const sentences = original.split('. ');
      optimized = sentences.join('.\n');
    }

    // Add technical specifications
    if (!original.toLowerCase().includes('typescript') && !original.toLowerCase().includes('react')) {
      optimized += '\n\nTechnical: Use TypeScript and React with modern best practices.';
    }

    // Add UI/UX guidelines if missing
    if (!original.toLowerCase().includes('ui') && !original.toLowerCase().includes('design')) {
      optimized += '\n\nUI/UX: Create a clean, intuitive interface with proper spacing and visual hierarchy.';
    }

    // Add error handling if missing
    if (!original.toLowerCase().includes('error') && !original.toLowerCase().includes('validation')) {
      optimized += '\n\nInclude proper error handling and user feedback for all interactions.';
    }

    return optimized;
  }

  async integrateAIFeatures(params) {
    const { appName, features = [] } = params;
    
    const aiIntegrations = {
      chatbot: await this.generateChatbotIntegration(),
      contentGeneration: await this.generateContentAI(),
      smartAutomation: await this.generateAutomationAI(),
      imageGeneration: await this.generateImageAI(),
      codeAssistant: await this.generateCodeAssistantAI()
    };

    const selectedIntegrations = {};
    features.forEach(feature => {
      if (aiIntegrations[feature]) {
        selectedIntegrations[feature] = aiIntegrations[feature];
      }
    });

    // Generate Spark SDK integration code
    const sdkCode = await this.generateSparkSDKCode(selectedIntegrations);

    return {
      success: true,
      integrations: selectedIntegrations,
      sdkCode,
      instructions: this.getAIIntegrationInstructions(features)
    };
  }

  async generateChatbotIntegration() {
    return {
      code: `
// Chatbot integration using Spark SDK
import { useSparkAI } from '@github/spark-sdk';

export function Chatbot() {
  const { chat, isLoading } = useSparkAI({
    model: 'gpt-4',
    temperature: 0.7,
    systemPrompt: 'You are a helpful assistant.'
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    
    const response = await chat(input);
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: response }]);
    setInput('');
  };

  return (
    <div className="chatbot">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={\`message \${msg.role}\`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend} disabled={isLoading}>
          Send
        </button>
      </div>
    </div>
  );
}`,
      prompt: 'Add an AI-powered chatbot that can answer questions and provide assistance to users',
      models: ['gpt-4', 'claude-3', 'llama-2']
    };
  }

  async generateContentAI() {
    return {
      code: `
// Content generation using Spark SDK
import { useSparkAI } from '@github/spark-sdk';

export function ContentGenerator() {
  const { generate } = useSparkAI({
    model: 'claude-3-sonnet',
    maxTokens: 500
  });

  const generateContent = async (type, context) => {
    const prompts = {
      blog: \`Write a blog post about \${context}\`,
      social: \`Create a social media post about \${context}\`,
      email: \`Draft a professional email about \${context}\`
    };

    return await generate(prompts[type]);
  };

  return { generateContent };
}`,
      prompt: 'Include AI-powered content generation for blogs, social media, and emails',
      models: ['claude-3-sonnet', 'gpt-4', 'mistral']
    };
  }

  async generateAutomationAI() {
    return {
      code: `
// Smart automation using Spark SDK
import { useSparkAI } from '@github/spark-sdk';

export function SmartAutomation() {
  const { analyze, predict } = useSparkAI({
    model: 'gpt-4-turbo',
    functions: ['analyze_pattern', 'predict_outcome', 'suggest_action']
  });

  const automateTask = async (taskData) => {
    const analysis = await analyze(taskData);
    const prediction = await predict(analysis);
    
    return {
      shouldAutomate: prediction.confidence > 0.8,
      suggestedAction: prediction.action,
      reasoning: analysis.explanation
    };
  };

  return { automateTask };
}`,
      prompt: 'Add smart automation that learns from user behavior and automates repetitive tasks',
      models: ['gpt-4-turbo', 'claude-3-opus']
    };
  }

  async generateImageAI() {
    return {
      code: `
// Image generation using Spark SDK
import { useSparkAI } from '@github/spark-sdk';

export function ImageGenerator() {
  const { generateImage } = useSparkAI({
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'hd'
  });

  const createImage = async (prompt, style = 'realistic') => {
    const enhancedPrompt = \`\${prompt}, \${style} style, high quality, detailed\`;
    const imageUrl = await generateImage(enhancedPrompt);
    return imageUrl;
  };

  return { createImage };
}`,
      prompt: 'Include AI image generation capabilities using DALL-E 3',
      models: ['dall-e-3', 'stable-diffusion', 'midjourney']
    };
  }

  async generateCodeAssistantAI() {
    return {
      code: `
// Code assistant using Spark SDK
import { useSparkAI } from '@github/spark-sdk';

export function CodeAssistant() {
  const { complete, explain, fix } = useSparkAI({
    model: 'codex',
    language: 'typescript'
  });

  const assistWithCode = async (code, action) => {
    switch(action) {
      case 'complete':
        return await complete(code);
      case 'explain':
        return await explain(code);
      case 'fix':
        return await fix(code);
      default:
        return null;
    }
  };

  return { assistWithCode };
}`,
      prompt: 'Add a code assistant that can complete, explain, and fix code',
      models: ['codex', 'copilot', 'codewhisperer']
    };
  }

  async generateSparkSDKCode(integrations) {
    const imports = [];
    const hooks = [];
    const components = [];

    Object.entries(integrations).forEach(([feature, config]) => {
      imports.push(`import { ${feature} } from './ai/${feature}';`);
      hooks.push(`const ${feature}Hook = use${feature.charAt(0).toUpperCase() + feature.slice(1)}();`);
      components.push(`<${feature.charAt(0).toUpperCase() + feature.slice(1)} />`);
    });

    return `
// Spark SDK Main Integration File
import { SparkProvider, useSparkAI } from '@github/spark-sdk';
${imports.join('\n')}

export function App() {
  return (
    <SparkProvider
      apiKey={process.env.SPARK_API_KEY}
      config={{
        defaultModel: 'claude-3-sonnet',
        temperature: 0.7,
        maxRetries: 3
      }}
    >
      <MainApp />
    </SparkProvider>
  );
}

function MainApp() {
  ${hooks.join('\n  ')}

  return (
    <div className="app">
      ${components.join('\n      ')}
    </div>
  );
}`;
  }

  async deploySpark(params) {
    const { appName, environment = 'production', permissions = 'private' } = params;
    
    // Deployment configuration
    const deployConfig = {
      app: appName,
      environment,
      permissions,
      pwa: {
        enabled: true,
        manifest: await this.generatePWAManifest(appName),
        serviceWorker: true,
        installPrompt: true
      },
      hosting: {
        provider: 'github-spark',
        url: `https://spark.github.com/${appName}`,
        customDomain: params.customDomain || null
      },
      sync: {
        autoSync: true,
        devices: ['desktop', 'mobile', 'tablet'],
        offline: true
      }
    };

    // Generate deployment script
    const deploymentScript = `
#!/bin/bash
# GitHub Spark Deployment Script

echo "Deploying ${appName} to GitHub Spark..."

# Ensure authenticated
gh auth status || exit 1

# Deploy to Spark
spark deploy \\
  --app "${appName}" \\
  --env "${environment}" \\
  --permissions "${permissions}" \\
  --pwa \\
  --auto-sync

echo "Deployment complete!"
echo "Access your app at: ${deployConfig.hosting.url}"
`;

    return {
      success: true,
      config: deployConfig,
      script: deploymentScript,
      url: deployConfig.hosting.url,
      instructions: this.getDeploymentInstructions(deployConfig)
    };
  }

  async generatePWAManifest(appName) {
    return {
      name: appName,
      short_name: appName,
      description: `${appName} - Built with GitHub Spark`,
      start_url: '/',
      display: 'standalone',
      theme_color: '#000000',
      background_color: '#ffffff',
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
  }

  async analyzeUseCase(params) {
    const { projectType, requirements = [], constraints = [] } = params;
    
    const analysis = {
      suitable: false,
      score: 0,
      reasons: [],
      alternatives: [],
      recommendation: ''
    };

    // Analyze suitability for Spark
    const suitableTypes = [
      'prototype', 'mvp', 'micro-app', 'internal-tool', 'personal-project',
      'hackathon', 'demo', 'poc', 'landing-page', 'dashboard'
    ];

    const unsuitableTypes = [
      'enterprise', 'banking', 'healthcare-critical', 'real-time-trading',
      'high-security', 'large-scale', 'legacy-migration'
    ];

    if (suitableTypes.includes(projectType)) {
      analysis.suitable = true;
      analysis.score += 50;
      analysis.reasons.push(`${projectType} is an excellent use case for GitHub Spark`);
    } else if (unsuitableTypes.includes(projectType)) {
      analysis.suitable = false;
      analysis.score -= 30;
      analysis.reasons.push(`${projectType} may be too complex or critical for Spark`);
      analysis.alternatives.push('Consider traditional development with full CI/CD pipeline');
    }

    // Check requirements compatibility
    const sparkStrengths = [
      'rapid-development', 'ai-features', 'no-infrastructure', 'instant-deployment',
      'pwa', 'github-integration', 'natural-language', 'low-code'
    ];

    requirements.forEach(req => {
      if (sparkStrengths.includes(req)) {
        analysis.score += 10;
        analysis.reasons.push(`Spark excels at ${req}`);
      }
    });

    // Check constraints
    const sparkLimitations = [
      'requires-copilot-pro-plus', 'limited-to-web', 'claude-sonnet-only',
      'micro-app-scope', 'limited-backend'
    ];

    constraints.forEach(constraint => {
      if (constraint === 'free' || constraint === 'no-subscription') {
        analysis.score -= 20;
        analysis.reasons.push('Spark requires Copilot Pro+ subscription ($39/month)');
      }
      if (constraint === 'native-mobile') {
        analysis.score -= 10;
        analysis.reasons.push('Spark creates PWAs, not native mobile apps');
      }
      if (constraint === 'complex-backend') {
        analysis.score -= 15;
        analysis.reasons.push('Spark is better suited for simpler backend requirements');
      }
    });

    // Generate recommendation
    if (analysis.score >= 60) {
      analysis.recommendation = 'Highly Recommended: GitHub Spark is perfect for this project';
      analysis.suitable = true;
    } else if (analysis.score >= 30) {
      analysis.recommendation = 'Conditionally Recommended: Spark can work with some adjustments';
      analysis.suitable = true;
    } else {
      analysis.recommendation = 'Not Recommended: Consider traditional development approaches';
      analysis.suitable = false;
      analysis.alternatives.push(
        'Use Next.js with Vercel for full-stack apps',
        'Use Flutter for native mobile apps',
        'Use AWS Amplify for enterprise solutions'
      );
    }

    return analysis;
  }

  async generateSparkCode(params) {
    const { feature, context = {} } = params;
    
    const codeGenerators = {
      dataStorage: () => this.generateDataStorageCode(),
      authentication: () => this.generateAuthCode(),
      apiIntegration: () => this.generateAPICode(),
      realtimeSync: () => this.generateRealtimeCode(),
      theming: () => this.generateThemingCode()
    };

    const generator = codeGenerators[feature];
    if (!generator) {
      return { error: `Unknown feature: ${feature}` };
    }

    const code = await generator();
    return {
      success: true,
      feature,
      code,
      integration: this.getIntegrationSteps(feature)
    };
  }

  async generateDataStorageCode() {
    return `
// Spark Data Storage
import { useSparkData } from '@github/spark-sdk';

export function useAppData() {
  const { data, setData, syncData, clearData } = useSparkData('app-storage');

  const saveItem = async (key: string, value: any) => {
    await setData({ ...data, [key]: value });
    await syncData(); // Sync across devices
  };

  const getItem = (key: string) => data[key];

  const deleteItem = async (key: string) => {
    const newData = { ...data };
    delete newData[key];
    await setData(newData);
    await syncData();
  };

  return { saveItem, getItem, deleteItem, clearAll: clearData };
}`;
  }

  async generateAuthCode() {
    return `
// GitHub Authentication with Spark
import { useSparkAuth } from '@github/spark-sdk';

export function useAuth() {
  const { user, signIn, signOut, isAuthenticated } = useSparkAuth();

  const handleSignIn = async () => {
    try {
      await signIn('github');
      console.log('Signed in as:', user.login);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    signIn: handleSignIn,
    signOut
  };
}`;
  }

  async generateAPICode() {
    return `
// API Integration with Spark
import { useSparkAPI } from '@github/spark-sdk';

export function useAPI() {
  const { fetch: sparkFetch, loading, error } = useSparkAPI();

  const fetchData = async (endpoint: string) => {
    return await sparkFetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const postData = async (endpoint: string, data: any) => {
    return await sparkFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  };

  return { fetchData, postData, loading, error };
}`;
  }

  async generateRealtimeCode() {
    return `
// Realtime Sync with Spark
import { useSparkRealtime } from '@github/spark-sdk';

export function useRealtime(channel: string) {
  const { subscribe, publish, presence } = useSparkRealtime(channel);

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      console.log('Received:', message);
      // Handle incoming messages
    });

    return unsubscribe;
  }, [subscribe]);

  const sendMessage = async (data: any) => {
    await publish(data);
  };

  return { sendMessage, presence };
}`;
  }

  async generateThemingCode() {
    return `
// Theming with Spark
import { useSparkTheme } from '@github/spark-sdk';

export function useTheming() {
  const { theme, setTheme, customColors } = useSparkTheme();

  const themes = {
    light: {
      primary: '#3B82F6',
      background: '#FFFFFF',
      text: '#1F2937'
    },
    dark: {
      primary: '#60A5FA',
      background: '#111827',
      text: '#F9FAFB'
    },
    custom: customColors
  };

  const applyTheme = (themeName: string) => {
    setTheme(themes[themeName] || themes.light);
  };

  return { currentTheme: theme, applyTheme, themes };
}`;
  }

  async migrateToSpark(params) {
    const { currentStack, appType, complexity } = params;
    
    const migrationPlan = {
      feasibility: this.assessMigrationFeasibility(currentStack, complexity),
      steps: [],
      timeline: '',
      considerations: [],
      prompts: []
    };

    // Generate migration steps
    if (migrationPlan.feasibility.score >= 60) {
      migrationPlan.steps = [
        {
          phase: 'Analysis',
          tasks: [
            'Identify core features to migrate',
            'Document current API endpoints',
            'List UI components and interactions',
            'Map data models and storage needs'
          ]
        },
        {
          phase: 'Preparation',
          tasks: [
            'Set up Copilot Pro+ subscription',
            'Create GitHub repository',
            'Prepare design mockups and specifications',
            'Write detailed feature descriptions'
          ]
        },
        {
          phase: 'Prompt Engineering',
          tasks: [
            'Create initial Spark prompt with all requirements',
            'Test with preview and iterate',
            'Refine based on output',
            'Add AI features where beneficial'
          ]
        },
        {
          phase: 'Development',
          tasks: [
            'Generate base application with Spark',
            'Customize UI components',
            'Integrate existing APIs',
            'Add custom business logic if needed'
          ]
        },
        {
          phase: 'Deployment',
          tasks: [
            'Configure permissions and access',
            'Deploy as PWA',
            'Test on multiple devices',
            'Set up monitoring and analytics'
          ]
        }
      ];

      // Generate example prompts for migration
      migrationPlan.prompts = this.generateMigrationPrompts(currentStack, appType);
      migrationPlan.timeline = this.estimateTimeline(complexity);
    }

    migrationPlan.considerations = [
      'Spark works best for micro-apps and prototypes',
      'Complex backend logic may need separate API',
      'Current limited to Claude Sonnet 4 model',
      'Requires ongoing Copilot Pro+ subscription',
      'PWA deployment (not native mobile)'
    ];

    return migrationPlan;
  }

  assessMigrationFeasibility(stack, complexity) {
    const feasibility = { score: 50, factors: [] };
    
    // Positive factors
    if (stack.includes('react')) {
      feasibility.score += 20;
      feasibility.factors.push('React is natively supported');
    }
    if (stack.includes('typescript')) {
      feasibility.score += 10;
      feasibility.factors.push('TypeScript is the default language');
    }
    if (complexity === 'simple' || complexity === 'moderate') {
      feasibility.score += 20;
      feasibility.factors.push('Complexity level is suitable for Spark');
    }

    // Negative factors
    if (stack.includes('angular') || stack.includes('vue')) {
      feasibility.score -= 10;
      feasibility.factors.push('Framework conversion needed');
    }
    if (complexity === 'complex' || complexity === 'enterprise') {
      feasibility.score -= 30;
      feasibility.factors.push('May be too complex for Spark');
    }
    if (stack.includes('native')) {
      feasibility.score -= 20;
      feasibility.factors.push('Native features not directly supported');
    }

    return feasibility;
  }

  generateMigrationPrompts(stack, appType) {
    const basePrompt = `Migrate a ${appType} application with the following specifications:\n\n`;
    
    const prompts = [
      {
        title: 'Initial Structure',
        prompt: basePrompt + `
- Create the main application structure with routing
- Include navigation header and sidebar
- Set up responsive layout for mobile and desktop
- Use modern, clean design with good UX`
      },
      {
        title: 'Data Layer',
        prompt: basePrompt + `
- Implement data storage for user preferences and app state
- Add CRUD operations for main entities
- Include data validation and error handling
- Set up automatic data synchronization`
      },
      {
        title: 'Authentication',
        prompt: basePrompt + `
- Add GitHub authentication
- Implement user roles and permissions
- Create user profile management
- Add session handling and security`
      },
      {
        title: 'AI Features',
        prompt: basePrompt + `
- Add intelligent search with natural language processing
- Implement content recommendations
- Include automated data analysis
- Add predictive features based on user behavior`
      }
    ];

    return prompts;
  }

  estimateTimeline(complexity) {
    const timelines = {
      simple: '1-2 days',
      moderate: '3-5 days',
      complex: '1-2 weeks',
      enterprise: 'Not recommended for Spark'
    };
    
    return timelines[complexity] || 'Varies based on requirements';
  }

  getRecommendation(type, features) {
    const recommendations = {
      'micro-app': 'Perfect for Spark! You can build and deploy this in hours.',
      'prototype': 'Excellent choice. Spark excels at rapid prototyping.',
      'mvp': 'Great fit. You can validate your idea quickly with Spark.',
      'enterprise': 'Consider traditional development. Spark may be too limited.',
      'internal-tool': 'Ideal use case. Spark handles authentication and deployment.'
    };

    let recommendation = recommendations[type] || 'Spark can handle this with some considerations.';

    if (features.includes('ai')) {
      recommendation += ' The AI features will be seamlessly integrated with GitHub Models.';
    }
    if (features.includes('realtime')) {
      recommendation += ' Real-time features are supported through Spark SDK.';
    }
    if (features.includes('offline')) {
      recommendation += ' PWA deployment ensures offline functionality.';
    }

    return recommendation;
  }

  getAIIntegrationInstructions(features) {
    const instructions = [
      'Ensure you have Copilot Pro+ subscription active',
      'AI features are automatically configured with Spark SDK',
      'No API keys needed - authentication is handled by GitHub',
      'Models can be switched dynamically based on use case'
    ];

    features.forEach(feature => {
      switch(feature) {
        case 'chatbot':
          instructions.push('Chatbot will use conversation history for context');
          break;
        case 'contentGeneration':
          instructions.push('Content generation includes multiple formats and styles');
          break;
        case 'imageGeneration':
          instructions.push('Image generation requires additional credits for DALL-E 3');
          break;
      }
    });

    return instructions;
  }

  getDeploymentInstructions(config) {
    return [
      `1. Ensure your Spark app "${config.app}" is ready for deployment`,
      `2. Run the deployment script or use Spark UI`,
      `3. Configure permissions to "${config.permissions}"`,
      `4. PWA will be available at: ${config.hosting.url}`,
      `5. Install prompt will appear on compatible devices`,
      `6. App will sync across all authenticated devices`,
      `7. Offline mode is automatically enabled`,
      config.hosting.customDomain ? `8. Configure custom domain: ${config.hosting.customDomain}` : null
    ].filter(Boolean);
  }

  getIntegrationSteps(feature) {
    const steps = {
      dataStorage: [
        'Import useSparkData hook',
        'Initialize with unique storage key',
        'Use saveItem/getItem for data operations',
        'Data automatically syncs across devices'
      ],
      authentication: [
        'Import useSparkAuth hook',
        'Call signIn("github") to authenticate',
        'Access user object for profile data',
        'Use isAuthenticated for route guards'
      ],
      apiIntegration: [
        'Import useSparkAPI hook',
        'Use sparkFetch for HTTP requests',
        'Automatic error handling included',
        'Loading states managed automatically'
      ],
      realtimeSync: [
        'Import useSparkRealtime hook',
        'Subscribe to channels for updates',
        'Publish messages to all subscribers',
        'Presence shows active users'
      ],
      theming: [
        'Import useSparkTheme hook',
        'Define light/dark/custom themes',
        'Apply themes dynamically',
        'Themes persist across sessions'
      ]
    };

    return steps[feature] || [];
  }

  generateAppName(idea) {
    // Generate a suitable app name from the idea
    const words = idea.toLowerCase().split(' ');
    const keywords = words.filter(w => w.length > 3 && !['that', 'with', 'from', 'this'].includes(w));
    
    if (keywords.length >= 2) {
      return keywords.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    }
    
    return 'SparkApp' + Date.now().toString().slice(-4);
  }
}

module.exports = GitHubSparkSpecialistAgent;