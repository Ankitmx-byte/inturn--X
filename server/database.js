const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inturnx', {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Insert demo data in background (don't await to avoid blocking)
    insertDemoData().catch(err => console.error('Demo data insertion error:', err));

    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error; // Don't exit process in serverless
  }
};

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Internship = require('./models/Internship');
const Project = require('./models/Project');

// Insert demo data
const insertDemoData = async () => {
  try {
    // Check if demo user exists
    const existingUser = await User.findOne({ email: 'demo@inturnx.com' });
    if (!existingUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('demo123', 12);

      const demoUser = new User({
        name: 'Demo User',
        email: 'demo@inturnx.com',
        password: hashedPassword,
        role: 'student',
        xp: 150,
        badges: ['First Login', 'Explorer'],
        skills: ['JavaScript', 'React']
      });
      await demoUser.save();
      console.log('Demo user inserted');
    }

    // Check if courses exist
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      const courses = [
        {
          title: 'Introduction to JavaScript',
          description: 'Learn the fundamentals of JavaScript programming',
          content: 'Comprehensive JavaScript course covering basics to advanced concepts',
          includes: 'Video lectures, coding exercises, quizzes, and projects',
          certificate: 'JavaScript Fundamentals Certificate',
          modules: [
            { title: 'Variables & Data Types', content: 'Understanding variables, data types, and basic operations', type: 'video', duration: 30, xpReward: 25 },
            { title: 'Functions', content: 'Creating and using functions in JavaScript', type: 'video', duration: 45, xpReward: 30 },
            { title: 'Objects & Arrays', content: 'Working with objects and arrays', type: 'video', duration: 40, xpReward: 25 },
            { title: 'DOM Manipulation', content: 'Interacting with the Document Object Model', type: 'project', duration: 60, xpReward: 50 }
          ],
          category: 'Programming',
          difficulty: 'beginner',
          duration: '4 weeks',
          xpReward: 100,
          order: 1,
          videos: 4
        },
        {
          title: 'React Fundamentals',
          description: 'Build modern web applications with React',
          content: 'Master React development with hands-on projects and real-world examples',
          includes: 'React components, hooks, state management, and routing',
          certificate: 'React Developer Certificate',
          modules: [
            { title: 'Components', content: 'Building reusable React components', type: 'video', duration: 35, xpReward: 25 },
            { title: 'State & Props', content: 'Managing component state and props', type: 'video', duration: 40, xpReward: 30 },
            { title: 'Hooks', content: 'Using React hooks for state management', type: 'video', duration: 50, xpReward: 35 },
            { title: 'Routing', content: 'Implementing client-side routing', type: 'project', duration: 75, xpReward: 60 }
          ],
          category: 'Frontend',
          difficulty: 'intermediate',
          duration: '6 weeks',
          xpReward: 150,
          order: 2,
          videos: 3
        },
        {
          title: 'Data Structures & Algorithms',
          description: 'Master essential DSA concepts for coding interviews',
          content: 'Comprehensive DSA course with problem-solving techniques',
          includes: 'Algorithm analysis, data structure implementations, and coding problems',
          certificate: 'DSA Mastery Certificate',
          modules: [
            { title: 'Arrays & Strings', content: 'Array and string manipulation techniques', type: 'video', duration: 55, xpReward: 40 },
            { title: 'Linked Lists', content: 'Understanding and implementing linked lists', type: 'video', duration: 60, xpReward: 45 },
            { title: 'Trees', content: 'Tree data structures and algorithms', type: 'video', duration: 70, xpReward: 50 },
            { title: 'Dynamic Programming', content: 'Solving complex problems with DP', type: 'project', duration: 90, xpReward: 65 }
          ],
          category: 'Computer Science',
          difficulty: 'advanced',
          duration: '8 weeks',
          xpReward: 200,
          order: 3,
          videos: 3
        }
      ];

      await Course.insertMany(courses);
      console.log('Demo courses inserted');
    }

    // Check if internships exist
    const internshipCount = await Internship.countDocuments();
    if (internshipCount === 0) {
      const internships = [
        {
          company: 'Google',
          title: 'Software Engineering Intern',
          description: 'Work on cutting-edge projects with experienced engineers',
          skills: ['JavaScript', 'Python', 'Data Structures'],
          stipend: '$8000/month',
          location: 'Mountain View, CA',
          type: 'traditional'
        },
        {
          company: 'Microsoft',
          title: 'Frontend Developer Intern',
          description: 'Build user interfaces for Microsoft products',
          skills: ['React', 'TypeScript', 'CSS'],
          stipend: '$7500/month',
          location: 'Redmond, WA',
          type: 'traditional'
        },
        {
          company: 'Amazon',
          title: 'Full Stack Developer Intern',
          description: 'Develop scalable web applications',
          skills: ['Node.js', 'React', 'AWS'],
          stipend: '$7000/month',
          location: 'Seattle, WA',
          type: 'project-based',
          collaborationWithCompany: true,
          projectDetails: 'Build an internal dashboard for team productivity',
          collaborationFeatures: ['Mentorship', 'Code Reviews', 'Team Collaboration']
        }
      ];

      await Internship.insertMany(internships);
      console.log('Demo internships inserted');
    }
  } catch (error) {
    console.error('Error inserting demo data:', error);
  }
};

module.exports = { connectDB, User, Course, Internship, Project };