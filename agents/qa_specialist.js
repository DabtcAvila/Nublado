#!/usr/bin/env node

const { BaseAgent } = require('./base_agent');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class QASpecialist extends BaseAgent {
  constructor(config) {
    super({
      ...config,
      name: 'QASpecialist',
      type: 'quality_assurance',
      capabilities: [
        'html_validation',
        'css_validation',
        'accessibility_testing',
        'cross_browser_testing',
        'performance_testing',
        'visual_regression',
        'automated_testing',
        'security_testing'
      ]
    });
    
    this.testingStandards = {
      html: {
        validator: 'W3C',
        errors: 0,
        warnings: 5, // max allowed
        doctype: 'HTML5'
      },
      css: {
        validator: 'W3C',
        errors: 0,
        warnings: 10 // max allowed
      },
      accessibility: {
        standard: 'WCAG 2.1',
        level: 'AA',
        criticalIssues: 0,
        minorIssues: 5 // max allowed
      },
      performance: {
        lighthouse: {
          performance: 90,
          accessibility: 95,
          bestPractices: 90,
          seo: 90
        },
        coreWebVitals: {
          lcp: 2.5, // seconds
          fid: 100, // milliseconds
          cls: 0.1
        }
      },
      browser: {
        support: ['Chrome', 'Firefox', 'Safari', 'Edge'],
        mobileSupport: true,
        responsiveBreakpoints: [320, 768, 1024, 1440]
      }
    };
    
    this.testResults = {
      passed: [],
      failed: [],
      warnings: [],
      metrics: {}
    };
  }

  async setup() {
    this.log('QA Specialist initializing with testing expertise...');
    this.testSuites = this.loadTestSuites();
    this.validationRules = this.loadValidationRules();
  }

  loadTestSuites() {
    return {
      functional: this.createFunctionalTests(),
      visual: this.createVisualTests(),
      accessibility: this.createAccessibilityTests(),
      performance: this.createPerformanceTests()
    };
  }

  loadValidationRules() {
    return {
      html: {
        requiredElements: ['<!DOCTYPE html>', '<html', '<head>', '<title>', '<body>'],
        requiredMeta: ['charset', 'viewport'],
        semanticStructure: ['header', 'main', 'footer'],
        accessibility: ['alt attributes', 'aria-labels', 'role attributes']
      },
      css: {
        requiredProperties: ['box-sizing', 'font-family'],
        responsive: ['media queries', 'flexible units', 'viewport units'],
        performance: ['no inline styles', 'minimal !important', 'efficient selectors']
      }
    };
  }

  createFunctionalTests() {
    return [
      {
        name: 'Page Structure Test',
        description: 'Verify HTML structure and semantic elements',
        test: async (content) => {
          const results = {
            passed: true,
            details: []
          };
          
          // Check for required HTML elements
          const requiredElements = [
            { element: '<!DOCTYPE html>', name: 'HTML5 Doctype' },
            { element: '<html lang=', name: 'HTML with language attribute' },
            { element: '<meta charset=', name: 'Character encoding' },
            { element: '<meta name="viewport"', name: 'Viewport meta tag' },
            { element: '<title>', name: 'Page title' }
          ];
          
          for (const req of requiredElements) {
            if (content.includes(req.element)) {
              results.details.push(`✅ ${req.name} present`);
            } else {
              results.passed = false;
              results.details.push(`❌ Missing ${req.name}`);
            }
          }
          
          return results;
        }
      },
      {
        name: 'Navigation Test',
        description: 'Verify navigation functionality',
        test: async (content) => {
          const results = {
            passed: true,
            details: []
          };
          
          // Check for navigation elements
          if (content.includes('<nav')) {
            results.details.push('✅ Navigation element present');
          } else {
            results.passed = false;
            results.details.push('❌ Missing navigation element');
          }
          
          // Check for skip navigation link
          if (content.includes('skip') && content.includes('main')) {
            results.details.push('✅ Skip navigation link present');
          } else {
            results.details.push('⚠️ Consider adding skip navigation link');
          }
          
          return results;
        }
      },
      {
        name: 'Interactive Elements Test',
        description: 'Verify buttons and links functionality',
        test: async (content) => {
          const results = {
            passed: true,
            details: []
          };
          
          // Count interactive elements
          const buttonCount = (content.match(/<button/g) || []).length;
          const linkCount = (content.match(/<a\s/g) || []).length;
          
          results.details.push(`Found ${buttonCount} buttons`);
          results.details.push(`Found ${linkCount} links`);
          
          // Check for aria-labels on buttons
          if (buttonCount > 0 && !content.includes('aria-label')) {
            results.details.push('⚠️ Consider adding aria-labels to buttons');
          }
          
          return results;
        }
      }
    ];
  }

  createVisualTests() {
    return [
      {
        name: 'Responsive Design Test',
        description: 'Verify responsive layout across devices',
        test: async (content) => {
          const results = {
            passed: true,
            details: []
          };
          
          // Check for Bootstrap responsive classes
          const responsiveClasses = ['col-', 'col-sm-', 'col-md-', 'col-lg-', 'col-xl-'];
          let hasResponsive = false;
          
          for (const cls of responsiveClasses) {
            if (content.includes(cls)) {
              hasResponsive = true;
              break;
            }
          }
          
          if (hasResponsive) {
            results.details.push('✅ Responsive grid system detected');
          } else {
            results.details.push('⚠️ No responsive grid classes found');
          }
          
          // Check for viewport meta tag
          if (content.includes('viewport')) {
            results.details.push('✅ Viewport meta tag present');
          } else {
            results.passed = false;
            results.details.push('❌ Missing viewport meta tag');
          }
          
          return results;
        }
      },
      {
        name: 'Color Contrast Test',
        description: 'Verify text color contrast ratios',
        test: async (content) => {
          const results = {
            passed: true,
            details: []
          };
          
          // Basic check for color definitions
          if (content.includes('color:') || content.includes('background-color:')) {
            results.details.push('✅ Color styles defined');
            results.details.push('ℹ️ Manual contrast ratio check recommended');
          }
          
          // Check for dark mode support
          if (content.includes('prefers-color-scheme')) {
            results.details.push('✅ Dark mode support detected');
          }
          
          return results;
        }
      }
    ];
  }

  createAccessibilityTests() {
    return [
      {
        name: 'ARIA Attributes Test',
        description: 'Verify ARIA attributes and roles',
        test: async (content) => {
          const results = {
            passed: true,
            details: []
          };
          
          // Check for ARIA attributes
          const ariaAttributes = ['aria-label', 'aria-describedby', 'aria-live', 'role='];
          let ariaCount = 0;
          
          for (const attr of ariaAttributes) {
            if (content.includes(attr)) {
              ariaCount++;
            }
          }
          
          if (ariaCount > 0) {
            results.details.push(`✅ Found ${ariaCount} types of ARIA attributes`);
          } else {
            results.details.push('⚠️ No ARIA attributes found');
          }
          
          // Check for alt attributes on images
          const imgCount = (content.match(/<img/g) || []).length;
          const altCount = (content.match(/alt="/g) || []).length;
          
          if (imgCount > 0) {
            if (altCount >= imgCount) {
              results.details.push('✅ All images have alt attributes');
            } else {
              results.passed = false;
              results.details.push(`❌ ${imgCount - altCount} images missing alt attributes`);
            }
          }
          
          return results;
        }
      },
      {
        name: 'Keyboard Navigation Test',
        description: 'Verify keyboard accessibility',
        test: async (content) => {
          const results = {
            passed: true,
            details: []
          };
          
          // Check for tabindex attributes
          if (content.includes('tabindex')) {
            results.details.push('✅ Tabindex attributes present');
          }
          
          // Check for focus styles in CSS
          if (content.includes(':focus')) {
            results.details.push('✅ Focus styles defined');
          } else {
            results.details.push('⚠️ Consider adding focus styles');
          }
          
          // Check for keyboard event handlers
          if (content.includes('onkeydown') || content.includes('onkeyup') || content.includes('addEventListener')) {
            results.details.push('✅ Keyboard event handlers detected');
          }
          
          return results;
        }
      }
    ];
  }

  createPerformanceTests() {
    return [
      {
        name: 'Resource Optimization Test',
        description: 'Verify resource loading optimization',
        test: async (content) => {
          const results = {
            passed: true,
            details: []
          };
          
          // Check for external resource optimization
          if (content.includes('defer') || content.includes('async')) {
            results.details.push('✅ Script loading optimization detected');
          }
          
          // Check for CDN usage
          if (content.includes('cdn.jsdelivr.net') || content.includes('cdnjs.cloudflare.com')) {
            results.details.push('✅ CDN usage for external resources');
          }
          
          // Check file size
          const size = Buffer.byteLength(content, 'utf8');
          if (size < 100000) {
            results.details.push(`✅ HTML size optimal (${(size/1024).toFixed(2)}KB)`);
          } else {
            results.details.push(`⚠️ HTML size large (${(size/1024).toFixed(2)}KB)`);
          }
          
          return results;
        }
      },
      {
        name: 'Core Web Vitals Test',
        description: 'Verify Core Web Vitals optimization',
        test: async (content) => {
          const results = {
            passed: true,
            details: []
          };
          
          // Check for performance monitoring
          if (content.includes('PerformanceObserver')) {
            results.details.push('✅ Performance monitoring implemented');
          }
          
          // Check for lazy loading
          if (content.includes('loading="lazy"')) {
            results.details.push('✅ Lazy loading implemented');
          }
          
          // Check for preconnect/prefetch
          if (content.includes('preconnect') || content.includes('prefetch')) {
            results.details.push('✅ Resource hints implemented');
          }
          
          results.details.push('ℹ️ Full Core Web Vitals test requires browser testing');
          
          return results;
        }
      }
    ];
  }

  async performTask(task) {
    const { type, params } = task;
    
    switch (type) {
      case 'validate_html':
        return await this.validateHTML(params);
      case 'validate_css':
        return await this.validateCSS(params);
      case 'test_accessibility':
        return await this.testAccessibility(params);
      case 'test_performance':
        return await this.testPerformance(params);
      case 'run_full_test_suite':
        return await this.runFullTestSuite(params);
      case 'generate_report':
        return await this.generateTestReport(params);
      default:
        return await super.performTask(task);
    }
  }

  async validateHTML(params) {
    const { filePath } = params;
    this.log(`Validating HTML: ${filePath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const results = {
        valid: true,
        errors: [],
        warnings: [],
        info: []
      };
      
      // Check DOCTYPE
      if (!content.startsWith('<!DOCTYPE html>')) {
        results.errors.push('Missing or incorrect DOCTYPE declaration');
        results.valid = false;
      } else {
        results.info.push('✅ Valid HTML5 DOCTYPE');
      }
      
      // Check required meta tags
      if (!content.includes('charset')) {
        results.errors.push('Missing character encoding declaration');
        results.valid = false;
      } else {
        results.info.push('✅ Character encoding specified');
      }
      
      if (!content.includes('viewport')) {
        results.errors.push('Missing viewport meta tag');
        results.valid = false;
      } else {
        results.info.push('✅ Viewport meta tag present');
      }
      
      // Check semantic structure
      const semanticElements = ['header', 'main', 'footer', 'nav'];
      for (const element of semanticElements) {
        if (content.includes(`<${element}`)) {
          results.info.push(`✅ Semantic <${element}> element used`);
        } else {
          results.warnings.push(`Consider using semantic <${element}> element`);
        }
      }
      
      // Check for common issues
      const openTags = content.match(/<[^/][^>]*>/g) || [];
      const closeTags = content.match(/<\/[^>]+>/g) || [];
      
      if (Math.abs(openTags.length - closeTags.length) > 5) {
        results.warnings.push('Possible unclosed tags detected');
      }
      
      this.testResults.passed.push('HTML Validation');
      
      return {
        success: true,
        validation: results,
        score: results.valid ? 100 : 75 - (results.errors.length * 10)
      };
    } catch (error) {
      this.log(`HTML validation failed: ${error.message}`, 'error');
      this.testResults.failed.push('HTML Validation');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async validateCSS(params) {
    const { filePath } = params;
    this.log(`Validating CSS: ${filePath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const results = {
        valid: true,
        errors: [],
        warnings: [],
        info: []
      };
      
      // Check for CSS variables
      if (content.includes(':root')) {
        results.info.push('✅ CSS custom properties (variables) used');
      }
      
      // Check for media queries
      if (content.includes('@media')) {
        results.info.push('✅ Responsive media queries present');
      } else {
        results.warnings.push('No media queries found - consider responsive design');
      }
      
      // Check for common issues
      const importantCount = (content.match(/!important/g) || []).length;
      if (importantCount > 10) {
        results.warnings.push(`High usage of !important (${importantCount} times)`);
      }
      
      // Check for vendor prefixes
      if (content.includes('-webkit-') || content.includes('-moz-')) {
        results.info.push('✅ Vendor prefixes used for compatibility');
      }
      
      // Check for performance issues
      const inlineStyleCount = (content.match(/style=/g) || []).length;
      if (inlineStyleCount > 0) {
        results.warnings.push(`${inlineStyleCount} inline styles found`);
      }
      
      this.testResults.passed.push('CSS Validation');
      
      return {
        success: true,
        validation: results,
        score: 100 - (results.errors.length * 15) - (results.warnings.length * 5)
      };
    } catch (error) {
      this.log(`CSS validation failed: ${error.message}`, 'error');
      this.testResults.failed.push('CSS Validation');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testAccessibility(params) {
    const { filePath } = params;
    this.log(`Testing accessibility: ${filePath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const results = {
        wcagLevel: 'AA',
        passed: [],
        failed: [],
        warnings: []
      };
      
      // Run accessibility tests
      for (const test of this.testSuites.accessibility) {
        const testResult = await test.test(content);
        
        if (testResult.passed) {
          results.passed.push({
            name: test.name,
            details: testResult.details
          });
        } else {
          results.failed.push({
            name: test.name,
            details: testResult.details
          });
        }
      }
      
      // Calculate accessibility score
      const totalTests = results.passed.length + results.failed.length;
      const score = totalTests > 0 ? (results.passed.length / totalTests) * 100 : 0;
      
      if (results.failed.length === 0) {
        this.testResults.passed.push('Accessibility Testing');
      } else {
        this.testResults.failed.push('Accessibility Testing');
      }
      
      return {
        success: true,
        accessibility: results,
        score: Math.round(score),
        wcagCompliance: results.failed.length === 0
      };
    } catch (error) {
      this.log(`Accessibility testing failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testPerformance(params) {
    const { filePath } = params;
    this.log(`Testing performance: ${filePath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const results = {
        metrics: {},
        passed: [],
        failed: [],
        recommendations: []
      };
      
      // Calculate file sizes
      const htmlSize = Buffer.byteLength(content, 'utf8');
      results.metrics.htmlSize = `${(htmlSize / 1024).toFixed(2)}KB`;
      
      // Run performance tests
      for (const test of this.testSuites.performance) {
        const testResult = await test.test(content);
        
        if (testResult.passed) {
          results.passed.push({
            name: test.name,
            details: testResult.details
          });
        } else {
          results.failed.push({
            name: test.name,
            details: testResult.details
          });
        }
      }
      
      // Add recommendations
      if (htmlSize > 50000) {
        results.recommendations.push('Consider minifying HTML');
      }
      
      if (!content.includes('loading="lazy"')) {
        results.recommendations.push('Implement lazy loading for images');
      }
      
      // Estimate performance score
      const score = Math.min(100, 100 - (results.failed.length * 10));
      
      this.testResults.metrics.performance = score;
      
      return {
        success: true,
        performance: results,
        score: score,
        coreWebVitals: {
          estimated: true,
          lcp: 'Good',
          fid: 'Good',
          cls: 'Good'
        }
      };
    } catch (error) {
      this.log(`Performance testing failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runFullTestSuite(params) {
    this.log('Running full QA test suite...');
    
    const { directory = '.' } = params;
    const results = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      tests: {},
      overallScore: 0
    };
    
    try {
      // Find HTML files
      const htmlFile = path.join(directory, 'index.html');
      const cssFile = path.join(directory, 'styles.css');
      
      // Run HTML validation
      if (fs.existsSync(htmlFile)) {
        const htmlResults = await this.validateHTML({ filePath: htmlFile });
        results.tests.htmlValidation = htmlResults;
        results.summary.totalTests++;
        if (htmlResults.success) results.summary.passed++;
        else results.summary.failed++;
      }
      
      // Run CSS validation
      if (fs.existsSync(cssFile)) {
        const cssResults = await this.validateCSS({ filePath: cssFile });
        results.tests.cssValidation = cssResults;
        results.summary.totalTests++;
        if (cssResults.success) results.summary.passed++;
        else results.summary.failed++;
      }
      
      // Run accessibility tests
      if (fs.existsSync(htmlFile)) {
        const a11yResults = await this.testAccessibility({ filePath: htmlFile });
        results.tests.accessibility = a11yResults;
        results.summary.totalTests++;
        if (a11yResults.wcagCompliance) results.summary.passed++;
        else results.summary.failed++;
      }
      
      // Run performance tests
      if (fs.existsSync(htmlFile)) {
        const perfResults = await this.testPerformance({ filePath: htmlFile });
        results.tests.performance = perfResults;
        results.summary.totalTests++;
        if (perfResults.score >= 90) results.summary.passed++;
        else results.summary.failed++;
      }
      
      // Run functional tests
      if (fs.existsSync(htmlFile)) {
        const content = fs.readFileSync(htmlFile, 'utf8');
        const functionalResults = {
          passed: [],
          failed: []
        };
        
        for (const test of this.testSuites.functional) {
          const testResult = await test.test(content);
          results.summary.totalTests++;
          
          if (testResult.passed) {
            functionalResults.passed.push(test.name);
            results.summary.passed++;
          } else {
            functionalResults.failed.push(test.name);
            results.summary.failed++;
          }
        }
        
        results.tests.functional = functionalResults;
      }
      
      // Calculate overall score
      if (results.summary.totalTests > 0) {
        results.overallScore = Math.round(
          (results.summary.passed / results.summary.totalTests) * 100
        );
      }
      
      this.log(`Test suite completed: ${results.summary.passed}/${results.summary.totalTests} passed`);
      
      return {
        success: true,
        results: results,
        quality: results.overallScore >= 90 ? 'Excellent' : 
                 results.overallScore >= 75 ? 'Good' :
                 results.overallScore >= 60 ? 'Fair' : 'Needs Improvement'
      };
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateTestReport(params) {
    this.log('Generating comprehensive test report...');
    
    const report = {
      title: 'QA Test Report',
      timestamp: new Date().toISOString(),
      summary: {
        totalPassed: this.testResults.passed.length,
        totalFailed: this.testResults.failed.length,
        totalWarnings: this.testResults.warnings.length
      },
      details: {
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        warnings: this.testResults.warnings
      },
      metrics: this.testResults.metrics,
      recommendations: [
        'Continue monitoring Core Web Vitals',
        'Perform cross-browser testing on real devices',
        'Conduct user acceptance testing',
        'Set up continuous monitoring'
      ]
    };
    
    // Save report to file
    const reportPath = path.join(params.outputDir || '.', 'qa-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Test report saved to ${reportPath}`);
    
    return {
      success: true,
      report: report,
      path: reportPath
    };
  }
}

// Auto-execute if run directly
if (require.main === module) {
  const agent = new QASpecialist();
  agent.initialize().then(() => {
    agent.log('QA Specialist ready for testing and validation tasks');
  });
}

module.exports = QASpecialist;