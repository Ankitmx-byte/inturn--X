const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PDFGenerator {
  async generateInterviewReport(interview, user, persona) {
    try {
      const html = this.buildReportHTML(interview, user, persona);
      const pdfBuffer = await this.htmlToPDF(html);
      
      // Save PDF
      const uploadsDir = path.join(__dirname, '../uploads/reports');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const filename = `interview_${interview._id}_${Date.now()}.pdf`;
      const filepath = path.join(uploadsDir, filename);
      
      await fs.writeFile(filepath, pdfBuffer);
      
      return `/uploads/reports/${filename}`;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  async htmlToPDF(html) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      return pdfBuffer;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  buildReportHTML(interview, user, persona) {
    const evaluation = interview.evaluation || {};
    const sections = evaluation.sections || {};
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      background: white;
    }
    
    .header {
      background: linear-gradient(135deg, #14A44D 0%, #5F2EEA 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 36px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .header p {
      font-size: 18px;
      opacity: 0.95;
    }
    
    .container {
      padding: 30px;
    }
    
    .info-section {
      background: #f8f9fa;
      border-left: 4px solid #14A44D;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 8px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .score-section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #14A44D;
    }
    
    .overall-score {
      text-align: center;
      background: linear-gradient(135deg, #14A44D 0%, #5F2EEA 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    
    .overall-score .score {
      font-size: 72px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .overall-score .label {
      font-size: 18px;
      opacity: 0.95;
    }
    
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .score-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .score-card .score {
      font-size: 36px;
      font-weight: 700;
      color: #14A44D;
      margin-bottom: 5px;
    }
    
    .score-card .label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .list-section {
      margin-bottom: 30px;
    }
    
    .list-section ul {
      list-style: none;
      padding-left: 0;
    }
    
    .list-section li {
      padding: 12px 15px;
      margin-bottom: 10px;
      background: #f8f9fa;
      border-left: 4px solid #14A44D;
      border-radius: 4px;
    }
    
    .list-section.weaknesses li {
      border-left-color: #FF4B2B;
    }
    
    .list-section.recommendations li {
      border-left-color: #5F2EEA;
    }
    
    .analysis-section {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .analysis-section p {
      font-size: 15px;
      line-height: 1.8;
      color: #333;
    }
    
    .transcript-section {
      margin-bottom: 30px;
    }
    
    .transcript-entry {
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 8px;
    }
    
    .transcript-entry.ai {
      background: #e8f5e9;
      border-left: 4px solid #14A44D;
    }
    
    .transcript-entry.user {
      background: #f3e5f5;
      border-left: 4px solid #5F2EEA;
    }
    
    .transcript-entry .role {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      color: #666;
    }
    
    .transcript-entry .text {
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
    }
    
    .footer {
      text-align: center;
      padding: 30px;
      background: #f8f9fa;
      margin-top: 40px;
    }
    
    .footer p {
      font-size: 14px;
      color: #666;
    }
    
    .footer .brand {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #14A44D 0%, #5F2EEA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    
    @media print {
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Mock Interview Report</h1>
    <p>InturnX AI Interview Assessment</p>
  </div>
  
  <div class="container">
    <!-- Candidate Information -->
    <div class="info-section">
      <h2 style="font-size: 20px; margin-bottom: 15px;">Candidate Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Name</span>
          <span class="info-value">${user.name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">${user.email}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Interviewer</span>
          <span class="info-value">${persona.avatar} ${persona.name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date</span>
          <span class="info-value">${new Date(interview.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Difficulty</span>
          <span class="info-value">${interview.difficulty.charAt(0).toUpperCase() + interview.difficulty.slice(1)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Interview Types</span>
          <span class="info-value">${interview.type.join(', ')}</span>
        </div>
      </div>
    </div>
    
    <!-- Overall Score -->
    <div class="overall-score">
      <div class="score">${evaluation.overallScore || 0}/100</div>
      <div class="label">Overall Performance Score</div>
    </div>
    
    <!-- Section Scores -->
    <div class="score-section">
      <h2 class="section-title">Performance Breakdown</h2>
      <div class="scores-grid">
        ${sections.hr ? `
        <div class="score-card">
          <div class="score">${sections.hr}</div>
          <div class="label">HR & Behavioral</div>
        </div>` : ''}
        ${sections.technical ? `
        <div class="score-card">
          <div class="score">${sections.technical}</div>
          <div class="label">Technical</div>
        </div>` : ''}
        ${sections.dsa ? `
        <div class="score-card">
          <div class="score">${sections.dsa}</div>
          <div class="label">DSA</div>
        </div>` : ''}
        ${sections.systemDesign ? `
        <div class="score-card">
          <div class="score">${sections.systemDesign}</div>
          <div class="label">System Design</div>
        </div>` : ''}
        ${sections.communication ? `
        <div class="score-card">
          <div class="score">${sections.communication}</div>
          <div class="label">Communication</div>
        </div>` : ''}
        ${sections.coding ? `
        <div class="score-card">
          <div class="score">${sections.coding}</div>
          <div class="label">Coding</div>
        </div>` : ''}
      </div>
    </div>
    
    <!-- Analysis -->
    ${evaluation.analysis ? `
    <div class="analysis-section">
      <h2 class="section-title">Detailed Analysis</h2>
      <p>${evaluation.analysis}</p>
    </div>` : ''}
    
    <!-- Strengths -->
    ${evaluation.strengths && evaluation.strengths.length > 0 ? `
    <div class="list-section strengths">
      <h2 class="section-title">💪 Key Strengths</h2>
      <ul>
        ${evaluation.strengths.map(strength => `<li>${strength}</li>`).join('')}
      </ul>
    </div>` : ''}
    
    <!-- Weaknesses -->
    ${evaluation.weaknesses && evaluation.weaknesses.length > 0 ? `
    <div class="list-section weaknesses">
      <h2 class="section-title">📈 Areas for Improvement</h2>
      <ul>
        ${evaluation.weaknesses.map(weakness => `<li>${weakness}</li>`).join('')}
      </ul>
    </div>` : ''}
    
    <!-- Recommendations -->
    ${evaluation.recommendations && evaluation.recommendations.length > 0 ? `
    <div class="list-section recommendations">
      <h2 class="section-title">🎯 Recommendations</h2>
      <ul>
        ${evaluation.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>` : ''}
    
    <!-- Coding Results -->
    ${interview.coding && interview.coding.code ? `
    <div class="page-break"></div>
    <div class="score-section">
      <h2 class="section-title">💻 Coding Round Results</h2>
      <div class="info-section">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Language</span>
            <span class="info-value">${interview.coding.language}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Test Cases Passed</span>
            <span class="info-value">${interview.coding.passCount}/${interview.coding.passCount + interview.coding.failCount}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Runtime</span>
            <span class="info-value">${interview.coding.runtime}ms</span>
          </div>
        </div>
      </div>
    </div>` : ''}
    
    <!-- Transcript Highlights -->
    ${interview.transcript && interview.transcript.length > 0 ? `
    <div class="page-break"></div>
    <div class="transcript-section">
      <h2 class="section-title">📝 Interview Transcript Highlights</h2>
      ${interview.transcript.slice(0, 10).map(entry => `
        <div class="transcript-entry ${entry.role}">
          <div class="role">${entry.role === 'ai' ? persona.name : user.name}</div>
          <div class="text">${entry.text}</div>
        </div>
      `).join('')}
      ${interview.transcript.length > 10 ? '<p style="text-align: center; color: #666; margin-top: 20px;">... and more in the full transcript</p>' : ''}
    </div>` : ''}
  </div>
  
  <div class="footer">
    <div class="brand">InturnX</div>
    <p>AI-Powered Mock Interview Platform</p>
    <p style="margin-top: 10px; font-size: 12px;">Generated on ${new Date().toLocaleString('en-US')}</p>
  </div>
</body>
</html>
    `;
  }
}

module.exports = new PDFGenerator();