#!/usr/bin/env node

const CoreAgent = require('./core_agent');
const fs = require('fs').promises;
const path = require('path');

class APIIntegrationAgent extends CoreAgent {
  constructor(config = {}) {
    super({
      ...config,
      id: 'agent_006',
      name: 'API Integration Agent',
      type: 'backend_integration',
      capabilities: [
        'rest_api',
        'graphql',
        'websockets',
        'state_management',
        'axios',
        'fetch',
        'apollo',
        'redux',
        'zustand',
        'error_handling',
        'caching',
        'authentication'
      ],
      branch: 'feature/api',
      permissions: {
        read: ['*'],
        write: ['src/api/**', 'src/services/**', 'src/store/**'],
        execute: ['test:api', 'mock:server']
      }
    });
  }

  async processTask(task) {
    switch (task.type) {
      case 'setup_api_client':
        return await this.setupAPIClient(task.params);
      case 'implement_graphql':
        return await this.implementGraphQL(task.params);
      case 'setup_websocket':
        return await this.setupWebSocket(task.params);
      case 'implement_auth':
        return await this.implementAuthentication(task.params);
      default:
        return await super.processTask(task);
    }
  }

  async setupAPIClient(params) {
    const { baseURL = '/api', timeout = 10000 } = params;
    
    const apiClient = `
import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: '${baseURL}',
  timeout: ${timeout},
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  response => response.data,
  async error => {
    if (error.response?.status === 401) {
      // Handle token refresh
      const newToken = await refreshToken();
      if (newToken) {
        error.config.headers.Authorization = \`Bearer \${newToken}\`;
        return apiClient.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  get: (url, params) => apiClient.get(url, { params }),
  post: (url, data) => apiClient.post(url, data),
  put: (url, data) => apiClient.put(url, data),
  patch: (url, data) => apiClient.patch(url, data),
  delete: (url) => apiClient.delete(url),
};

export default apiClient;`;

    await fs.mkdir(path.join(process.cwd(), 'src', 'api'), { recursive: true });
    await fs.writeFile(path.join(process.cwd(), 'src', 'api', 'client.js'), apiClient);
    
    return { success: true, client: 'axios' };
  }

  async implementGraphQL(params) {
    const graphqlSetup = `
import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// HTTP connection
const httpLink = createHttpLink({
  uri: process.env.REACT_APP_GRAPHQL_URI || '/graphql',
});

// Auth link
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      ...headers,
      authorization: token ? \`Bearer \${token}\` : "",
    }
  };
});

// Apollo Client
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

// GraphQL queries
export const QUERIES = {
  GET_USER: gql\`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
        avatar
      }
    }
  \`,
  GET_POSTS: gql\`
    query GetPosts($limit: Int, $offset: Int) {
      posts(limit: $limit, offset: $offset) {
        id
        title
        content
        author {
          name
        }
      }
    }
  \`
};`;

    await fs.writeFile(path.join(process.cwd(), 'src', 'api', 'graphql.js'), graphqlSetup);
    return { success: true, graphql: true };
  }

  async setupWebSocket(params) {
    const wsClient = `
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    this.listeners = new Map();
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data.payload);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected');
      this.attemptReconnect();
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(\`Reconnecting... Attempt \${this.reconnectAttempts}\`);
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export default new WebSocketClient(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');`;

    await fs.writeFile(path.join(process.cwd(), 'src', 'api', 'websocket.js'), wsClient);
    return { success: true, websocket: true };
  }

  async implementAuthentication(params) {
    const authService = `
class AuthService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data;
      
      this.setTokens(token, refreshToken);
      this.setUser(user);
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      this.clearTokens();
      this.clearUser();
      window.location.href = '/login';
    }
  }

  async refreshAccessToken() {
    try {
      const response = await api.post('/auth/refresh', {
        refreshToken: this.refreshToken
      });
      const { token } = response.data;
      this.setToken(token);
      return token;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  clearUser() {
    this.user = null;
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }
}

export default new AuthService();`;

    await fs.writeFile(path.join(process.cwd(), 'src', 'services', 'auth.js'), authService);
    return { success: true, authentication: true };
  }
}

module.exports = APIIntegrationAgent;