const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class CertificateGenerator {
  constructor() {
    this.certificatesDir = path.join(__dirname, '../uploads/certificates');
    this.ensureCertificatesDir();
  }

  async ensureCertificatesDir() {
    try {
      await fs.mkdir(this.certificatesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating certificates directory:', error);
    }
  }

  generateCertificateId() {
    return `INTURNX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  async generateCourseCertificate(userData, courseData, completionData) {
    try {
      const certificateId = this.generateCertificateId();
      const issueDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const html = this.getCertificateHTML({
        candidateName: userData.name,
        courseName: courseData.title,
        issueDate,
        certificateId,
        grade: completionData.grade || 'Pass',
        signature: 'Ankit',
        verificationUrl: `${process.env.CLIENT_URL}/verify/${certificateId}`
      });

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const certificatePath = path.join(this.certificatesDir, `${certificateId}.pdf`);
      await page.pdf({
        path: certificatePath,
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      await browser.close();

      return {
        certificateId,
        filePath: certificatePath,
        fileUrl: `/uploads/certificates/${certificateId}.pdf`,
        verificationUrl: `${process.env.CLIENT_URL}/verify/${certificateId}`
      };
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }

  getCertificateHTML({ candidateName, courseName, issueDate, certificateId, grade, signature, verificationUrl }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Completion</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px;
    }
    
    .certificate {
      background: white;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 60px 80px;
      border: 20px solid #14A44D;
      border-radius: 10px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: relative;
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      top: 30px;
      left: 30px;
      right: 30px;
      bottom: 30px;
      border: 2px solid #14A44D;
      pointer-events: none;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .logo {
      font-size: 48px;
      font-weight: bold;
      color: #14A44D;
      margin-bottom: 10px;
      font-family: 'Arial', sans-serif;
    }
    
    .subtitle {
      font-size: 18px;
      color: #666;
      letter-spacing: 2px;
    }
    
    .title {
      text-align: center;
      font-size: 56px;
      color: #333;
      margin: 40px 0;
      font-weight: normal;
      letter-spacing: 3px;
    }
    
    .content {
      text-align: center;
      margin: 40px 0;
    }
    
    .awarded-to {
      font-size: 20px;
      color: #666;
      margin-bottom: 20px;
    }
    
    .recipient-name {
      font-size: 48px;
      color: #14A44D;
      font-weight: bold;
      margin: 20px 0;
      padding: 10px 0;
      border-bottom: 3px solid #14A44D;
      display: inline-block;
    }
    
    .description {
      font-size: 20px;
      color: #555;
      margin: 30px auto;
      max-width: 800px;
      line-height: 1.8;
    }
    
    .course-name {
      font-size: 32px;
      color: #333;
      font-weight: bold;
      margin: 20px 0;
    }
    
    .grade-badge {
      display: inline-block;
      background: linear-gradient(135deg, #14A44D, #0d7a3a);
      color: white;
      padding: 10px 30px;
      border-radius: 50px;
      font-size: 20px;
      font-weight: bold;
      margin: 20px 0;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 60px;
      padding-top: 40px;
      border-top: 2px solid #eee;
    }
    
    .signature-section {
      text-align: center;
    }
    
    .signature-line {
      width: 250px;
      border-top: 2px solid #333;
      margin: 40px auto 10px;
    }
    
    .signature-name {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    
    .signature-title {
      font-size: 16px;
      color: #666;
    }
    
    .certificate-info {
      text-align: left;
    }
    
    .info-item {
      font-size: 14px;
      color: #666;
      margin: 5px 0;
    }
    
    .info-label {
      font-weight: bold;
      color: #333;
    }
    
    .verification-section {
      text-align: right;
    }
    
    .qr-placeholder {
      width: 100px;
      height: 100px;
      background: #f0f0f0;
      border: 2px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #999;
      margin-left: auto;
    }
    
    .verification-text {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">InturnX</div>
      <div class="subtitle">AI-POWERED INTERNSHIP PLATFORM</div>
    </div>
    
    <h1 class="title">Certificate of Completion</h1>
    
    <div class="content">
      <p class="awarded-to">This certificate is proudly presented to</p>
      
      <div class="recipient-name">${candidateName}</div>
      
      <p class="description">
        For successfully completing the comprehensive course
      </p>
      
      <div class="course-name">${courseName}</div>
      
      <div class="grade-badge">Grade: ${grade}</div>
      
      <p class="description">
        Demonstrating exceptional dedication, skill development, and mastery of the subject matter.
      </p>
    </div>
    
    <div class="footer">
      <div class="certificate-info">
        <div class="info-item"><span class="info-label">Certificate ID:</span> ${certificateId}</div>
        <div class="info-item"><span class="info-label">Issue Date:</span> ${issueDate}</div>
        <div class="info-item"><span class="info-label">Verification:</span> ${verificationUrl}</div>
      </div>
      
      <div class="signature-section">
        <div class="signature-line"></div>
        <div class="signature-name">${signature}</div>
        <div class="signature-title">Founder & CEO, InturnX</div>
      </div>
      
      <div class="verification-section">
        <div class="qr-placeholder">QR Code</div>
        <div class="verification-text">Scan to verify</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}

module.exports = new CertificateGenerator();