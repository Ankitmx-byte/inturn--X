import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import BackButton from './BackButton';

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedCertificates, setUploadedCertificates] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateName, setCertificateName] = useState('');

  const [resumeData, setResumeData] = useState({
    personalInfo: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      location: '',
      summary: ''
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: []
  });

  useEffect(() => {
    fetchResumeData();
  }, []);

  const fetchResumeData = async () => {
    try {
      const response = await axios.get('/api/auth/profile');
      const userData = response.data.user;
      
      if (userData.resumeData) {
        setResumeData(userData.resumeData);
      }
      
      setUploadedCertificates(userData.uploadedCertificates || []);
    } catch (error) {
      console.error('Failed to fetch resume data:', error);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setMessage('Please select a resume file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      await axios.put('/api/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('Resume uploaded successfully!');
      setResumeFile(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Resume upload error:', error);
      setMessage('Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateUpload = async (e) => {
    e.preventDefault();
    if (!certificateFile) {
      setMessage('Please select a certificate file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('certificate', certificateFile);
      formData.append('name', certificateName || certificateFile.name);

      const response = await axios.post('/api/auth/upload-certificate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadedCertificates([...uploadedCertificates, response.data.certificate]);
      setMessage('Certificate uploaded successfully!');
      setCertificateFile(null);
      setCertificateName('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Certificate upload error:', error);
      setMessage('Failed to upload certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificate = async (index) => {
    try {
      await axios.delete(`/api/auth/certificate/${index}`);
      const newCertificates = uploadedCertificates.filter((_, i) => i !== index);
      setUploadedCertificates(newCertificates);
      setMessage('Certificate deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Certificate delete error:', error);
      setMessage('Failed to delete certificate');
    }
  };

  const handleSaveResumeData = async () => {
    setLoading(true);
    try {
      await axios.put('/api/auth/resume-data', { resumeData });
      setMessage('Resume data saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Resume save error:', error);
      setMessage('Failed to save resume data');
    } finally {
      setLoading(false);
    }
  };

  const addEducation = () => {
    setResumeData({
      ...resumeData,
      education: [...resumeData.education, {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }]
    });
  };

  const addExperience = () => {
    setResumeData({
      ...resumeData,
      experience: [...resumeData.experience, {
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }]
    });
  };

  const addProject = () => {
    setResumeData({
      ...resumeData,
      projects: [...resumeData.projects, {
        name: '',
        description: '',
        technologies: [],
        link: '',
        startDate: '',
        endDate: ''
      }]
    });
  };

  const addSkillCategory = () => {
    setResumeData({
      ...resumeData,
      skills: [...resumeData.skills, {
        category: '',
        items: []
      }]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white">
      <BackButton />
      
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Resume Builder
              </h1>
              <p className="text-gray-400 mt-2">Create and manage your professional resume</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${message.includes('success') ? 'bg-green-500/20 border border-green-500/30 text-green-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resume Upload */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Upload Resume</h3>
              <form onSubmit={handleResumeUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Resume File (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#14A44D] file:text-white hover:file:bg-[#14A44D]/80"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !resumeFile}
                  className="w-full bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] text-white px-6 py-3 rounded-lg hover:shadow-[#14A44D]/40 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload Resume'}
                </button>
              </form>
            </div>

            {/* Certificate Upload */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Upload Certificate</h3>
              <form onSubmit={handleCertificateUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Certificate Name
                  </label>
                  <input
                    type="text"
                    value={certificateName}
                    onChange={(e) => setCertificateName(e.target.value)}
                    placeholder="e.g., React Certification"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Certificate File (PDF/Image)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setCertificateFile(e.target.files[0])}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#5F2EEA] file:text-white hover:file:bg-[#5F2EEA]/80"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !certificateFile}
                  className="w-full bg-gradient-to-r from-[#5F2EEA] to-[#14A44D] text-white px-6 py-3 rounded-lg hover:shadow-[#5F2EEA]/40 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload Certificate'}
                </button>
              </form>

              {/* Uploaded Certificates List */}
              {uploadedCertificates.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Uploaded Certificates</h4>
                  <div className="space-y-2">
                    {uploadedCertificates.map((cert, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm text-white truncate">{cert.name}</p>
                          <p className="text-xs text-gray-400">{new Date(cert.uploadedAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteCertificate(index)}
                          className="ml-2 text-red-400 hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resume Builder Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-6">
              <h3 className="text-xl font-bold">Build Your Resume</h3>

              {/* Personal Info */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={resumeData.personalInfo.fullName}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      personalInfo: { ...resumeData.personalInfo, fullName: e.target.value }
                    })}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={resumeData.personalInfo.email}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      personalInfo: { ...resumeData.personalInfo, email: e.target.value }
                    })}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={resumeData.personalInfo.phone}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      personalInfo: { ...resumeData.personalInfo, phone: e.target.value }
                    })}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={resumeData.personalInfo.location}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      personalInfo: { ...resumeData.personalInfo, location: e.target.value }
                    })}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                  />
                </div>
                <textarea
                  placeholder="Professional Summary"
                  value={resumeData.personalInfo.summary}
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    personalInfo: { ...resumeData.personalInfo, summary: e.target.value }
                  })}
                  rows={4}
                  className="mt-4 w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D] resize-none"
                />
              </div>

              {/* Education Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Education</h4>
                  <button
                    onClick={addEducation}
                    className="text-sm bg-[#14A44D] text-white px-4 py-2 rounded-lg hover:bg-[#14A44D]/80"
                  >
                    + Add Education
                  </button>
                </div>
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="mb-4 p-4 bg-white/5 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Institution"
                        value={edu.institution}
                        onChange={(e) => {
                          const newEducation = [...resumeData.education];
                          newEducation[index].institution = e.target.value;
                          setResumeData({ ...resumeData, education: newEducation });
                        }}
                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                      />
                      <input
                        type="text"
                        placeholder="Degree"
                        value={edu.degree}
                        onChange={(e) => {
                          const newEducation = [...resumeData.education];
                          newEducation[index].degree = e.target.value;
                          setResumeData({ ...resumeData, education: newEducation });
                        }}
                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Experience Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Experience</h4>
                  <button
                    onClick={addExperience}
                    className="text-sm bg-[#5F2EEA] text-white px-4 py-2 rounded-lg hover:bg-[#5F2EEA]/80"
                  >
                    + Add Experience
                  </button>
                </div>
                {resumeData.experience.map((exp, index) => (
                  <div key={index} className="mb-4 p-4 bg-white/5 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => {
                          const newExperience = [...resumeData.experience];
                          newExperience[index].company = e.target.value;
                          setResumeData({ ...resumeData, experience: newExperience });
                        }}
                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                      />
                      <input
                        type="text"
                        placeholder="Position"
                        value={exp.position}
                        onChange={(e) => {
                          const newExperience = [...resumeData.experience];
                          newExperience[index].position = e.target.value;
                          setResumeData({ ...resumeData, experience: newExperience });
                        }}
                        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Projects</h4>
                  <button
                    onClick={addProject}
                    className="text-sm bg-[#FF4B2B] text-white px-4 py-2 rounded-lg hover:bg-[#FF4B2B]/80"
                  >
                    + Add Project
                  </button>
                </div>
                {resumeData.projects.map((project, index) => (
                  <div key={index} className="mb-4 p-4 bg-white/5 rounded-lg">
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={project.name}
                      onChange={(e) => {
                        const newProjects = [...resumeData.projects];
                        newProjects[index].name = e.target.value;
                        setResumeData({ ...resumeData, projects: newProjects });
                      }}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                    />
                  </div>
                ))}
              </div>

              {/* Skills Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Skills</h4>
                  <button
                    onClick={addSkillCategory}
                    className="text-sm bg-[#FFD700] text-black px-4 py-2 rounded-lg hover:bg-[#FFD700]/80"
                  >
                    + Add Skill Category
                  </button>
                </div>
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="mb-4 p-4 bg-white/5 rounded-lg">
                    <input
                      type="text"
                      placeholder="Category (e.g., Programming Languages)"
                      value={skill.category}
                      onChange={(e) => {
                        const newSkills = [...resumeData.skills];
                        newSkills[index].category = e.target.value;
                        setResumeData({ ...resumeData, skills: newSkills });
                      }}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D]"
                    />
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveResumeData}
                  disabled={loading}
                  className="bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] text-white px-8 py-3 rounded-lg hover:shadow-[#14A44D]/40 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Resume Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}