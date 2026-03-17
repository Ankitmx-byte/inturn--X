import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { motion } from 'framer-motion';

const CoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/learning/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    if (filter === 'in-progress') return course.status === 'in-progress';
    if (filter === 'completed') return course.status === 'completed';
    if (filter === 'unlocked') return course.isUnlocked;
    return true;
  });

  const categories = [
    { key: 'all', label: 'All Courses' },
    { key: 'unlocked', label: 'Unlocked' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] flex items-center justify-center">
        <div className="text-white text-xl">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#14A44D] mb-2">Continue Learning</h1>
          <p className="text-gray-400">Master new skills with our comprehensive courses</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`px-6 py-2 rounded-lg whitespace-nowrap transition-all ${
                filter === cat.key
                  ? 'bg-[#14A44D] text-white'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-[#14A44D]/50 transition-all ${
                !course.isUnlocked ? 'opacity-60' : ''
              }`}
            >
              <div className="p-6">
                {/* Course Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-400">{course.category}</p>
                  </div>
                  {!course.isUnlocked && (
                    <div className="text-yellow-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">{course.description}</p>

                {/* Progress Bar */}
                {course.progress > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-[#14A44D] font-semibold">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-[#14A44D] h-2 rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Course Info */}
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span>{course.videos || 0} videos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>Certificate</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => course.isUnlocked && navigate(`/learning/courses/${course._id}`)}
                  disabled={!course.isUnlocked}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    course.isUnlocked
                      ? 'bg-[#14A44D] hover:bg-[#0d7a3a] text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {!course.isUnlocked ? 'Locked' :
                   course.status === 'completed' ? 'Review Course' :
                   course.status === 'in-progress' ? 'Continue Learning' :
                   'Start Course'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No courses found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;