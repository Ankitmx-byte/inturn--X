const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class AIService {
  constructor() {
    // Try Ollama first, fallback to mock responses
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'qwen2.5:latest';
    this.useOllama = true;
  }

  async checkOllamaAvailability() {
    try {
      await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 2000 });
      this.useOllama = true;
      console.log('✓ Ollama is available');
      return true;
    } catch (error) {
      this.useOllama = false;
      console.log('⚠ Ollama not available, using fallback responses');
      return false;
    }
  }

  async generateQuestion(persona, context) {
    const prompt = await this.buildQuestionPrompt(persona, context);
    
    if (this.useOllama) {
      try {
        return await this.callOllama(prompt);
      } catch (error) {
        console.error('Ollama error, using fallback:', error.message);
        return this.getFallbackQuestion(persona, context);
      }
    }
    
    return this.getFallbackQuestion(persona, context);
  }

  async generateFollowup(persona, question, answer) {
    const prompt = await this.buildFollowupPrompt(persona, question, answer);
    
    if (this.useOllama) {
      try {
        const response = await this.callOllama(prompt);
        return this.parseFollowupResponse(response);
      } catch (error) {
        console.error('Ollama error, using fallback:', error.message);
        return this.getFallbackFollowup(persona);
      }
    }
    
    return this.getFallbackFollowup(persona);
  }

  async evaluateInterview(persona, transcript, codingResults, duration) {
    // Always use intelligent evaluation for real scores
    console.log('Generating intelligent evaluation based on interview performance...');
    const intelligentEval = await this.generateIntelligentEvaluation(
      persona,
      transcript,
      codingResults,
      duration
    );
    
    // Try to enhance with AI if available
    if (this.useOllama) {
      try {
        const prompt = await this.buildEvaluationPrompt(persona, transcript, codingResults, duration);
        const response = await this.callOllama(prompt, true);
        const aiEval = this.parseEvaluation(response);
        
        // If AI evaluation succeeded, merge with intelligent evaluation
        if (aiEval && aiEval.overallScore) {
          console.log('Enhanced evaluation with AI insights');
          return {
            ...intelligentEval,
            // Use AI's analysis if available
            analysis: aiEval.analysis || intelligentEval.analysis,
            // Merge strengths and weaknesses
            strengths: [...new Set([...intelligentEval.strengths, ...(aiEval.strengths || [])])].slice(0, 4),
            weaknesses: [...new Set([...intelligentEval.weaknesses, ...(aiEval.weaknesses || [])])].slice(0, 3),
            recommendations: [...new Set([...intelligentEval.recommendations, ...(aiEval.recommendations || [])])].slice(0, 5)
          };
        }
      } catch (error) {
        console.log('AI enhancement failed, using intelligent evaluation:', error.message);
      }
    }
    
    return intelligentEval;
  }

  async callOllama(prompt, longResponse = false) {
    const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
      model: this.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: longResponse ? 1000 : 300
      }
    }, {
      timeout: 30000
    });

    return response.data.response.trim();
  }

  async buildQuestionPrompt(persona, context) {
    const template = await fs.readFile(path.join(__dirname, '../prompts/question.txt'), 'utf-8');
    
    return template
      .replace('{persona_name}', persona.name)
      .replace('{persona_title}', persona.title)
      .replace('{tone}', persona.tone)
      .replace('{personality}', persona.personality)
      .replace('{specialization}', persona.specialization.join(', '))
      .replace('{interview_types}', context.types.join(', '))
      .replace('{difficulty}', context.difficulty)
      .replace('{question_number}', context.questionNumber)
      .replace('{total_questions}', context.totalQuestions)
      .replace('{previous_questions}', context.previousQuestions.join('\n'));
  }

  async buildFollowupPrompt(persona, question, answer) {
    const template = await fs.readFile(path.join(__dirname, '../prompts/followup.txt'), 'utf-8');
    
    return template
      .replace('{persona_name}', persona.name)
      .replace('{persona_title}', persona.title)
      .replace('{tone}', persona.tone)
      .replace('{personality}', persona.personality)
      .replace('{previous_question}', question)
      .replace('{candidate_answer}', answer);
  }

  async buildEvaluationPrompt(persona, transcript, codingResults, duration) {
    const template = await fs.readFile(path.join(__dirname, '../prompts/evaluation.txt'), 'utf-8');
    
    const transcriptText = transcript.map(entry => 
      `${entry.role.toUpperCase()}: ${entry.text}`
    ).join('\n\n');

    const codingText = codingResults ? 
      `Language: ${codingResults.language}\nPassed: ${codingResults.passCount}/${codingResults.passCount + codingResults.failCount}\nRuntime: ${codingResults.runtime}ms` :
      'No coding round';

    return template
      .replace('{persona_name}', persona.name)
      .replace('{persona_title}', persona.title)
      .replace('{interview_types}', transcript.length > 0 ? 'Mixed' : 'Unknown')
      .replace('{difficulty}', 'Medium')
      .replace('{duration}', duration)
      .replace('{transcript}', transcriptText)
      .replace('{coding_results}', codingText)
      .replace('{evaluation_criteria}', JSON.stringify(persona.evaluation_criteria, null, 2));
  }

  parseFollowupResponse(response) {
    if (response.includes('FOLLOWUP:')) {
      return {
        needsFollowup: true,
        question: response.split('FOLLOWUP:')[1].trim()
      };
    }
    return {
      needsFollowup: false,
      acknowledgment: response.split('NEXT:')[1]?.trim() || "Good. Let's move on."
    };
  }

  parseEvaluation(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        // Ensure all required fields exist
        return this.validateEvaluation(evaluation);
      }
    } catch (error) {
      console.error('Failed to parse evaluation JSON:', error);
    }
    
    // If parsing fails, return null to trigger intelligent evaluation
    return null;
  }

  validateEvaluation(evaluation) {
    // Ensure scores are within 0-100 range
    const clampScore = (score) => Math.max(0, Math.min(100, score || 0));
    
    return {
      overallScore: clampScore(evaluation.overallScore),
      sections: {
        hr: clampScore(evaluation.sections?.hr),
        technical: clampScore(evaluation.sections?.technical),
        dsa: clampScore(evaluation.sections?.dsa),
        systemDesign: clampScore(evaluation.sections?.systemDesign),
        communication: clampScore(evaluation.sections?.communication),
        coding: clampScore(evaluation.sections?.coding)
      },
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      recommendations: evaluation.recommendations || [],
      confidence: clampScore(evaluation.confidence),
      analysis: evaluation.analysis || ''
    };
  }

  getFallbackQuestion(persona, context) {
    const templates = persona.question_templates;
    const type = context.types[0] || 'technical';
    const questions = templates[type.toLowerCase()] || templates.technical || [];
    
    if (questions.length === 0) {
      return "Tell me about a challenging project you've worked on recently.";
    }
    
    const index = (context.questionNumber - 1) % questions.length;
    return questions[index];
  }

  getFallbackFollowup(persona) {
    const triggers = persona.followup_triggers || [
      "Can you elaborate on that?",
      "What challenges did you face?",
      "How did you approach that problem?"
    ];
    
    const random = Math.random();
    if (random > 0.6) {
      return {
        needsFollowup: true,
        question: triggers[Math.floor(Math.random() * triggers.length)]
      };
    }
    
    return {
      needsFollowup: false,
      acknowledgment: "Good. Let's move to the next question."
    };
  }

  // Intelligent evaluation based on actual interview performance
  async generateIntelligentEvaluation(persona, transcript, codingResults, duration) {
    const userAnswers = transcript.filter(t => t.role === 'user');
    const aiQuestions = transcript.filter(t => t.role === 'ai');
    
    // Calculate answer quality metrics
    const avgAnswerLength = userAnswers.reduce((sum, a) => sum + a.text.length, 0) / (userAnswers.length || 1);
    const shortAnswers = userAnswers.filter(a => a.text.length < 50).length;
    const detailedAnswers = userAnswers.filter(a => a.text.length > 200).length;
    
    // Check for keywords indicating quality
    const technicalKeywords = ['algorithm', 'complexity', 'optimize', 'efficient', 'performance', 'scalable', 'architecture', 'design pattern', 'data structure'];
    const communicationKeywords = ['example', 'experience', 'project', 'team', 'challenge', 'solution', 'learned', 'improved'];
    
    let technicalScore = 50;
    let communicationScore = 50;
    let detailScore = 50;
    
    // Analyze answers
    userAnswers.forEach(answer => {
      const text = answer.text.toLowerCase();
      
      // Technical depth
      const techKeywordCount = technicalKeywords.filter(kw => text.includes(kw)).length;
      technicalScore += techKeywordCount * 5;
      
      // Communication quality
      const commKeywordCount = communicationKeywords.filter(kw => text.includes(kw)).length;
      communicationScore += commKeywordCount * 5;
      
      // Detail and structure
      if (answer.text.length > 150) detailScore += 5;
      if (answer.text.includes('first') || answer.text.includes('second') || answer.text.includes('finally')) {
        detailScore += 10; // Structured answer
      }
    });
    
    // Normalize scores
    technicalScore = Math.min(100, technicalScore);
    communicationScore = Math.min(100, communicationScore);
    detailScore = Math.min(100, detailScore);
    
    // Penalize very short answers
    const shortAnswerPenalty = (shortAnswers / (userAnswers.length || 1)) * 20;
    communicationScore -= shortAnswerPenalty;
    
    // Reward detailed answers
    const detailBonus = (detailedAnswers / (userAnswers.length || 1)) * 15;
    technicalScore += detailBonus;
    
    // Coding score
    let codingScore = 0;
    if (codingResults) {
      const passRate = codingResults.passCount / (codingResults.passCount + codingResults.failCount);
      codingScore = passRate * 100;
      
      // Bonus for good runtime
      if (codingResults.runtime < 100) codingScore += 10;
      if (codingResults.runtime < 50) codingScore += 5;
    }
    
    // Calculate section scores based on interview types
    const sections = {
      hr: Math.round(Math.min(100, communicationScore + (detailScore * 0.3))),
      technical: Math.round(Math.min(100, technicalScore)),
      dsa: Math.round(Math.min(100, codingScore || (technicalScore * 0.8))),
      systemDesign: Math.round(Math.min(100, (technicalScore * 0.7) + (detailScore * 0.3))),
      communication: Math.round(Math.min(100, communicationScore)),
      coding: Math.round(Math.min(100, codingScore || (technicalScore * 0.6)))
    };
    
    // Calculate overall score
    const relevantScores = [];
    if (sections.hr > 0) relevantScores.push(sections.hr);
    if (sections.technical > 0) relevantScores.push(sections.technical);
    if (codingResults) relevantScores.push(sections.coding);
    
    const overallScore = Math.round(
      relevantScores.reduce((sum, score) => sum + score, 0) / (relevantScores.length || 1)
    );
    
    // Generate strengths based on high scores
    const strengths = [];
    if (communicationScore >= 75) {
      strengths.push("Excellent communication skills with clear and structured responses");
    } else if (communicationScore >= 60) {
      strengths.push("Good communication with well-articulated answers");
    }
    
    if (detailedAnswers > userAnswers.length * 0.5) {
      strengths.push("Provides detailed explanations and comprehensive answers");
    }
    
    if (technicalScore >= 75) {
      strengths.push("Strong technical knowledge and understanding of concepts");
    }
    
    if (codingScore >= 80) {
      strengths.push("Excellent coding skills with high test case pass rate");
    } else if (codingScore >= 60) {
      strengths.push("Good problem-solving approach in coding challenges");
    }
    
    // Generate weaknesses based on low scores
    const weaknesses = [];
    if (shortAnswers > userAnswers.length * 0.4) {
      weaknesses.push("Many answers are too brief - provide more detailed explanations");
    }
    
    if (technicalScore < 60) {
      weaknesses.push("Need to strengthen technical knowledge and use more technical terminology");
    }
    
    if (communicationScore < 60) {
      weaknesses.push("Work on structuring answers better with clear examples");
    }
    
    if (codingScore > 0 && codingScore < 50) {
      weaknesses.push("Coding solutions need improvement - practice more problems");
    }
    
    if (avgAnswerLength < 100) {
      weaknesses.push("Answers could be more comprehensive with specific examples");
    }
    
    // Generate recommendations
    const recommendations = [];
    if (technicalScore < 70) {
      recommendations.push("Study core technical concepts and practice explaining them clearly");
      recommendations.push("Review fundamental data structures and algorithms");
    }
    
    if (codingScore < 70 && codingResults) {
      recommendations.push("Practice more coding problems on LeetCode or HackerRank");
      recommendations.push("Focus on writing clean, efficient code with good test coverage");
    }
    
    if (communicationScore < 70) {
      recommendations.push("Practice the STAR method for behavioral questions");
      recommendations.push("Prepare specific examples from your experience");
    }
    
    recommendations.push("Continue practicing mock interviews to build confidence");
    recommendations.push("Research the company and role thoroughly before real interviews");
    
    // Generate analysis
    const analysis = `The candidate completed ${userAnswers.length} questions in ${duration} minutes, demonstrating ${
      overallScore >= 80 ? 'excellent' : overallScore >= 65 ? 'good' : 'adequate'
    } performance overall. ${
      communicationScore >= 70 ? 'Communication was clear and well-structured.' : 'Communication could be improved with more detailed responses.'
    } ${
      technicalScore >= 70 ? 'Technical knowledge appears strong.' : 'Technical understanding needs reinforcement.'
    } ${
      codingResults ? `In the coding round, ${codingResults.passCount} out of ${codingResults.passCount + codingResults.failCount} test cases passed. ` : ''
    }${
      overallScore >= 75 ? 'With this performance level, the candidate shows good readiness for interviews.' : 'Continued practice in the identified areas will significantly improve interview performance.'
    }`;
    
    return {
      overallScore,
      sections,
      strengths: strengths.slice(0, 4),
      weaknesses: weaknesses.slice(0, 3),
      recommendations: recommendations.slice(0, 5),
      confidence: Math.round(Math.min(100, overallScore + (detailScore * 0.2))),
      analysis
    };
  }
}

module.exports = new AIService();