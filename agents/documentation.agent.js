#!/usr/bin/env node

const CoreAgent = require('./core_agent');
const fs = require('fs').promises;
const path = require('path');

class DocumentationAgent extends CoreAgent {
  constructor(config = {}) {
    super({
      ...config,
      id: 'agent_009',
      name: 'Documentation Agent',
      type: 'documentation_specialist',
      capabilities: [
        'jsdoc',
        'markdown',
        'api_docs',
        'user_guides',
        'storybook',
        'docusaurus',
        'readme_generation',
        'code_comments',
        'technical_writing',
        'diagram_generation'
      ],
      branch: 'feature/docs',
      permissions: {
        read: ['*'],
        write: ['docs/**', '*.md', '.storybook/**', '**/*.stories.js'],
        execute: ['build:docs', 'build:storybook']
      }
    });
  }

  async processTask(task) {
    switch (task.type) {
      case 'generate_docs':
        return await this.generateDocumentation(task.params);
      case 'create_readme':
        return await this.createReadme(task.params);
      case 'document_api':
        return await this.documentAPI(task.params);
      case 'create_storybook':
        return await this.createStorybook(task.params);
      default:
        return await super.processTask(task);
    }
  }

  async generateDocumentation(params) {
    const { component, props = [], methods = [] } = params;
    
    const docs = `# ${component} Component

## Overview
${params.description || 'Component description here'}

## Installation
\`\`\`bash
npm install ${component.toLowerCase()}
\`\`\`

## Usage
\`\`\`jsx
import ${component} from './${component}';

function App() {
  return (
    <${component}
      ${props.slice(0, 2).map(p => `${p.name}="${p.example}"`).join('\n      ')}
    />
  );
}
\`\`\`

## Props
| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
${props.map(p => `| ${p.name} | \`${p.type}\` | \`${p.default || 'undefined'}\` | ${p.required ? 'Yes' : 'No'} | ${p.description} |`).join('\n')}

## Methods
${methods.map(m => `### ${m.name}
${m.description}

**Parameters:**
${m.params?.map(p => `- \`${p.name}\` (${p.type}): ${p.description}`).join('\n') || 'None'}

**Returns:** \`${m.returns || 'void'}\`

**Example:**
\`\`\`javascript
${m.example || `component.${m.name}();`}
\`\`\`
`).join('\n')}

## Examples

### Basic Example
\`\`\`jsx
<${component} title="Hello World" />
\`\`\`

### Advanced Example
\`\`\`jsx
<${component}
  title="Advanced Usage"
  onAction={(data) => console.log(data)}
  config={{
    theme: 'dark',
    animated: true
  }}
>
  <ChildComponent />
</${component}>
\`\`\`

## Styling
The component accepts custom styles through the \`className\` and \`style\` props.

\`\`\`css
.custom-${component.toLowerCase()} {
  padding: 1rem;
  background: #f0f0f0;
}
\`\`\`

## Accessibility
- Fully keyboard navigable
- ARIA labels included
- Screen reader compatible
- WCAG 2.1 AA compliant

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License
MIT`;

    const docPath = path.join(process.cwd(), 'docs', 'components', `${component}.md`);
    await fs.mkdir(path.dirname(docPath), { recursive: true });
    await fs.writeFile(docPath, docs);

    return { success: true, documentation: docPath };
  }

  async createReadme(params) {
    const { projectName, description, features = [] } = params;
    
    const readme = `# ${projectName}

${description}

## 🚀 Features

${features.map(f => `- ✨ ${f}`).join('\n')}

## 📦 Installation

\`\`\`bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
\`\`\`

## 🛠️ Development

\`\`\`bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint
\`\`\`

## 📁 Project Structure

\`\`\`
${projectName}/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utility functions
│   ├── styles/         # Global styles
│   └── api/            # API integration
├── public/             # Static assets
├── tests/              # Test files
└── docs/               # Documentation
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run unit tests
npm run test:unit

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
\`\`\`

## 📝 Scripts

| Script | Description |
|--------|-------------|
| \`dev\` | Start development server |
| \`build\` | Build for production |
| \`test\` | Run tests |
| \`lint\` | Run ESLint |
| \`format\` | Format code with Prettier |
| \`analyze\` | Analyze bundle size |

## 🌐 Environment Variables

Create a \`.env\` file in the root directory:

\`\`\`env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_PUBLIC_URL=http://localhost:3000
\`\`\`

## 🚢 Deployment

### Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- Your Name - [@yourhandle](https://github.com/yourhandle)

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)`;

    await fs.writeFile(path.join(process.cwd(), 'README.md'), readme);
    
    return { success: true, readme: true };
  }

  async documentAPI(params) {
    const { endpoints = [] } = params;
    
    const apiDocs = `# API Documentation

## Base URL
\`\`\`
${params.baseURL || 'https://api.example.com/v1'}
\`\`\`

## Authentication
All API requests require authentication using Bearer tokens:

\`\`\`http
Authorization: Bearer YOUR_API_TOKEN
\`\`\`

## Endpoints

${endpoints.map(endpoint => `### ${endpoint.method} ${endpoint.path}
${endpoint.description}

**Parameters:**
${endpoint.params?.map(p => `- \`${p.name}\` (${p.type}, ${p.required ? 'required' : 'optional'}): ${p.description}`).join('\n') || 'None'}

**Request Body:**
\`\`\`json
${JSON.stringify(endpoint.body || {}, null, 2)}
\`\`\`

**Response:**
\`\`\`json
${JSON.stringify(endpoint.response || {}, null, 2)}
\`\`\`

**Status Codes:**
- \`200\`: Success
- \`400\`: Bad Request
- \`401\`: Unauthorized
- \`404\`: Not Found
- \`500\`: Internal Server Error
`).join('\n---\n\n')}

## Error Handling

All errors follow this format:
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
\`\`\`

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per API key

## Webhooks
Configure webhooks in your dashboard to receive real-time updates.`;

    const apiDocPath = path.join(process.cwd(), 'docs', 'api.md');
    await fs.writeFile(apiDocPath, apiDocs);

    return { success: true, apiDocs: apiDocPath };
  }

  async createStorybook(params) {
    const { component } = params;
    
    const storybook = `import React from 'react';
import ${component} from './${component}';

export default {
  title: 'Components/${component}',
  component: ${component},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Component description here'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'danger']
    },
    size: {
      control: { type: 'radio' },
      options: ['small', 'medium', 'large']
    },
    disabled: {
      control: 'boolean'
    }
  }
};

const Template = (args) => <${component} {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Default ${component}'
};

export const Primary = Template.bind({});
Primary.args = {
  variant: 'primary',
  children: 'Primary ${component}'
};

export const Secondary = Template.bind({});
Secondary.args = {
  variant: 'secondary',
  children: 'Secondary ${component}'
};

export const Large = Template.bind({});
Large.args = {
  size: 'large',
  children: 'Large ${component}'
};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
  children: 'Disabled ${component}'
};`;

    const storyPath = path.join(process.cwd(), 'src', 'components', component, `${component}.stories.js`);
    await fs.writeFile(storyPath, storybook);

    return { success: true, storybook: storyPath };
  }
}

module.exports = DocumentationAgent;