const axios = require('axios');

class Judge0Service {
  constructor() {
    this.baseUrl = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
    this.apiKey = process.env.RAPIDAPI_KEY || '';
    this.isEnabled = !!this.apiKey;

    // Language ID mapping for Judge0
    this.languageIds = {
      javascript: 63,  // Node.js
      python: 71,      // Python 3
      java: 62,        // Java
      cpp: 54,         // C++ (GCC 9.2.0)
      c: 50,           // C (GCC 9.2.0)
      csharp: 51,      // C#
      go: 60,          // Go
      rust: 73,        // Rust
      typescript: 74,  // TypeScript
      kotlin: 78,      // Kotlin
      swift: 83        // Swift
    };

    // Time and memory limits
    this.limits = {
      quiz: {
        cpu_time_limit: 5,      // 5 seconds
        memory_limit: 128000    // 128 MB
      },
      course: {
        cpu_time_limit: 10,     // 10 seconds
        memory_limit: 256000    // 256 MB
      },
      battle: {
        cpu_time_limit: 15,     // 15 seconds
        memory_limit: 512000    // 512 MB
      }
    };
  }

  async executeCode(code, language, input = '', context = 'quiz') {
    if (!this.isEnabled) {
      return this.mockExecution(code, language, input);
    }

    try {
      const languageId = this.languageIds[language.toLowerCase()];
      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }

      const limits = this.limits[context] || this.limits.quiz;

      // Submit code for execution
      const submissionResponse = await axios.post(
        `${this.baseUrl}/submissions?base64_encoded=false&wait=false`,
        {
          source_code: code,
          language_id: languageId,
          stdin: input,
          cpu_time_limit: limits.cpu_time_limit,
          memory_limit: limits.memory_limit
        },
        {
          headers: {
            'content-type': 'application/json',
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'x-rapidapi-key': this.apiKey
          }
        }
      );

      const token = submissionResponse.data.token;

      // Poll for result
      const result = await this.pollSubmission(token);
      return this.formatResult(result);
    } catch (error) {
      console.error('Judge0 execution error:', error.message);
      throw error;
    }
  }

  async executeWithTestCases(code, language, testCases, context = 'quiz') {
    const results = [];
    let totalTime = 0;
    let totalMemory = 0;

    for (const testCase of testCases) {
      try {
        const result = await this.executeCode(code, language, testCase.input, context);
        
        const passed = result.status.id === 3 && 
                      result.stdout?.trim() === testCase.expectedOutput?.trim();

        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: result.stdout || '',
          passed,
          error: result.stderr || result.compile_output || null,
          time: result.time,
          memory: result.memory,
          status: result.status
        });

        totalTime += parseFloat(result.time) || 0;
        totalMemory += parseInt(result.memory) || 0;
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          error: error.message,
          time: 0,
          memory: 0,
          status: { id: 0, description: 'Error' }
        });
      }
    }

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;

    return {
      results,
      totalTestCases: testCases.length,
      passedCount,
      failedCount,
      totalTime: totalTime.toFixed(3),
      avgMemory: Math.round(totalMemory / testCases.length),
      allPassed: passedCount === testCases.length
    };
  }

  async pollSubmission(token, maxAttempts = 40) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay to 1 second

      try {
        const response = await axios.get(
          `${this.baseUrl}/submissions/${token}?base64_encoded=false`,
          {
            headers: {
              'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
              'x-rapidapi-key': this.apiKey
            }
          }
        );

        const result = response.data;

        // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, >3=Error/Rejected
        if (result.status.id > 2) {
          return result;
        }
      } catch (error) {
        console.error('Polling error:', error.message);
      }

      attempts++;
    }

    throw new Error('Execution timeout - submission took too long');
  }

  formatResult(result) {
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      status: {
        id: result.status.id,
        description: result.status.description
      },
      time: result.time || '0',
      memory: result.memory || 0,
      token: result.token
    };
  }

  mockExecution(code, language, input) {
    // Mock execution for testing without Judge0 API
    return {
      stdout: 'Mock output',
      stderr: '',
      compile_output: '',
      status: {
        id: 3,
        description: 'Accepted'
      },
      time: '0.001',
      memory: 1024
    };
  }

  getLanguageId(language) {
    return this.languageIds[language.toLowerCase()] || null;
  }

  getSupportedLanguages() {
    return Object.keys(this.languageIds);
  }
}

module.exports = new Judge0Service();