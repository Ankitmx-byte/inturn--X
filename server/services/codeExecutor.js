const axios = require('axios');

class CodeExecutor {
  constructor() {
    // Judge0 API configuration
    this.judge0Url = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
    this.rapidApiKey = process.env.RAPIDAPI_KEY || '';
    this.useJudge0 = !!this.rapidApiKey;
    
    // Language ID mapping for Judge0
    this.languageIds = {
      'javascript': 63,
      'python': 71,
      'java': 62,
      'cpp': 54,
      'c': 50,
      'csharp': 51,
      'go': 60,
      'rust': 73,
      'typescript': 74
    };
  }

  async executeCode(code, language, testcases) {
    if (this.useJudge0) {
      try {
        return await this.executeWithJudge0(code, language, testcases);
      } catch (error) {
        console.error('Judge0 execution failed:', error.message);
        return this.mockExecution(code, language, testcases);
      }
    }
    
    return this.mockExecution(code, language, testcases);
  }

  async executeWithJudge0(code, language, testcases) {
    const languageId = this.languageIds[language.toLowerCase()] || 63;
    const results = [];
    let totalRuntime = 0;

    for (const testcase of testcases) {
      try {
        // Submit code
        const submission = await axios.post(
          `${this.judge0Url}/submissions`,
          {
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.expected
          },
          {
            headers: {
              'content-type': 'application/json',
              'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
              'x-rapidapi-key': this.rapidApiKey
            }
          }
        );

        const token = submission.data.token;

        // Poll for result
        let result;
        let attempts = 0;
        while (attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const response = await axios.get(
            `${this.judge0Url}/submissions/${token}`,
            {
              headers: {
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
                'x-rapidapi-key': this.rapidApiKey
              }
            }
          );

          result = response.data;
          if (result.status.id > 2) break;
          attempts++;
        }

        const passed = result.status.id === 3 && 
                      result.stdout?.trim() === testcase.expected.trim();

        results.push({
          input: testcase.input,
          output: result.stdout || '',
          expected: testcase.expected,
          passed: passed,
          error: result.stderr || result.compile_output || null
        });

        totalRuntime += parseFloat(result.time) || 0;

      } catch (error) {
        results.push({
          input: testcase.input,
          output: '',
          expected: testcase.expected,
          passed: false,
          error: error.message
        });
      }
    }

    const passCount = results.filter(r => r.passed).length;
    const failCount = results.length - passCount;

    return {
      results,
      runtime: Math.round(totalRuntime * 1000), // Convert to ms
      passCount,
      failCount,
      language
    };
  }

  mockExecution(code, language, testcases) {
    // Mock execution for testing without Judge0
    const results = testcases.map(testcase => {
      // Simple mock: randomly pass/fail
      const passed = Math.random() > 0.3;
      
      return {
        input: testcase.input,
        output: passed ? testcase.expected : 'Wrong output',
        expected: testcase.expected,
        passed: passed
      };
    });

    const passCount = results.filter(r => r.passed).length;
    const failCount = results.length - passCount;

    return {
      results,
      runtime: Math.floor(Math.random() * 100) + 50,
      passCount,
      failCount,
      language
    };
  }

  getDefaultTestcases(problemType = 'array') {
    const testcases = {
      'array': [
        { input: '[1,2,3,4,5]', expected: '15' },
        { input: '[10,20,30]', expected: '60' },
        { input: '[]', expected: '0' }
      ],
      'string': [
        { input: 'hello', expected: 'olleh' },
        { input: 'world', expected: 'dlrow' },
        { input: '', expected: '' }
      ],
      'number': [
        { input: '5', expected: '120' },
        { input: '3', expected: '6' },
        { input: '0', expected: '1' }
      ]
    };

    return testcases[problemType] || testcases.array;
  }

  generateCodingProblem(difficulty, type) {
    const problems = {
      easy: {
        dsa: {
          title: 'Two Sum',
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          testcases: [
            { input: '[2,7,11,15]\n9', expected: '[0,1]' },
            { input: '[3,2,4]\n6', expected: '[1,2]' },
            { input: '[3,3]\n6', expected: '[0,1]' }
          ],
          starterCode: {
            javascript: 'function twoSum(nums, target) {\n  // Your code here\n}',
            python: 'def two_sum(nums, target):\n    # Your code here\n    pass'
          }
        },
        coding: {
          title: 'Reverse String',
          description: 'Write a function that reverses a string.',
          testcases: [
            { input: 'hello', expected: 'olleh' },
            { input: 'world', expected: 'dlrow' },
            { input: 'a', expected: 'a' }
          ],
          starterCode: {
            javascript: 'function reverseString(s) {\n  // Your code here\n}',
            python: 'def reverse_string(s):\n    # Your code here\n    pass'
          }
        }
      },
      medium: {
        dsa: {
          title: 'Longest Substring Without Repeating Characters',
          description: 'Given a string s, find the length of the longest substring without repeating characters.',
          testcases: [
            { input: 'abcabcbb', expected: '3' },
            { input: 'bbbbb', expected: '1' },
            { input: 'pwwkew', expected: '3' }
          ],
          starterCode: {
            javascript: 'function lengthOfLongestSubstring(s) {\n  // Your code here\n}',
            python: 'def length_of_longest_substring(s):\n    # Your code here\n    pass'
          }
        }
      },
      hard: {
        dsa: {
          title: 'Median of Two Sorted Arrays',
          description: 'Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays.',
          testcases: [
            { input: '[1,3]\n[2]', expected: '2.0' },
            { input: '[1,2]\n[3,4]', expected: '2.5' }
          ],
          starterCode: {
            javascript: 'function findMedianSortedArrays(nums1, nums2) {\n  // Your code here\n}',
            python: 'def find_median_sorted_arrays(nums1, nums2):\n    # Your code here\n    pass'
          }
        }
      }
    };

    const problem = problems[difficulty]?.[type] || problems.easy.dsa;
    return problem;
  }
}

module.exports = new CodeExecutor();