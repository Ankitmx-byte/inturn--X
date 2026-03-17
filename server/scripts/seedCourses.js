require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

const courses = [
  {
    title: 'JavaScript Fundamentals',
    description: 'Master the basics of JavaScript programming',
    content: 'Learn variables, functions, objects, and more',
    includes: 'Video lectures, quizzes, coding exercises',
    certificate: 'Yes',
    category: 'Programming',
    order: 1,
    videos: 15
  },
  {
    title: 'React.js Mastery',
    description: 'Build modern web applications with React',
    content: 'Components, hooks, state management, and routing',
    includes: 'Video lectures, projects, final test',
    certificate: 'Yes',
    category: 'Frontend',
    order: 2,
    videos: 20
  },
  {
    title: 'Node.js Backend Development',
    description: 'Create scalable backend applications',
    content: 'Express, MongoDB, REST APIs, authentication',
    includes: 'Video lectures, coding challenges, project',
    certificate: 'Yes',
    category: 'Backend',
    order: 3,
    videos: 18
  },
  {
    title: 'Python for Data Science',
    description: 'Analyze data with Python',
    content: 'NumPy, Pandas, Matplotlib, machine learning basics',
    includes: 'Video lectures, notebooks, datasets',
    certificate: 'Yes',
    category: 'Data Science',
    order: 4,
    videos: 22
  },
  {
    title: 'Full Stack Web Development',
    description: 'Complete web development bootcamp',
    content: 'HTML, CSS, JavaScript, React, Node.js, databases',
    includes: 'Video lectures, projects, mentorship',
    certificate: 'Yes',
    category: 'Full Stack',
    order: 5,
    videos: 40
  },
  {
    title: 'Machine Learning Fundamentals',
    description: 'Introduction to machine learning',
    content: 'Supervised learning, neural networks, deep learning',
    includes: 'Video lectures, coding exercises, projects',
    certificate: 'Yes',
    category: 'AI/ML',
    order: 6,
    videos: 25
  },
  {
    title: 'DevOps Essentials',
    description: 'Learn DevOps practices and tools',
    content: 'Docker, Kubernetes, CI/CD, cloud deployment',
    includes: 'Video lectures, hands-on labs, projects',
    certificate: 'Yes',
    category: 'DevOps',
    order: 7,
    videos: 16
  },
  {
    title: 'Mobile App Development',
    description: 'Build mobile apps with React Native',
    content: 'React Native, navigation, state, native features',
    includes: 'Video lectures, app projects, deployment',
    certificate: 'Yes',
    category: 'Mobile',
    order: 8,
    videos: 18
  },
  {
    title: 'Cybersecurity Basics',
    description: 'Understand security principles',
    content: 'Network security, encryption, ethical hacking',
    includes: 'Video lectures, labs, certifications prep',
    certificate: 'Yes',
    category: 'Security',
    order: 9,
    videos: 14
  },
  {
    title: 'Cloud Computing with AWS',
    description: 'Master AWS cloud services',
    content: 'EC2, S3, Lambda, databases, deployment',
    includes: 'Video lectures, hands-on projects, AWS credits',
    certificate: 'Yes',
    category: 'Cloud',
    order: 10,
    videos: 20
  }
];

async function seedCourses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing courses and lessons
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    console.log('Cleared existing data');

    // Create courses
    for (const courseData of courses) {
      const course = await Course.create(courseData);
      console.log(`Created course: ${course.title}`);

      // Create sample lessons for each course
      const lessons = [
        {
          course: course._id,
          title: 'Introduction',
          description: 'Course overview and setup',
          order: 1,
          type: 'video',
          videoUrl: 'https://example.com/video1.mp4',
          videoType: 'mp4',
          duration: 600,
          isLocked: false,
          xpReward: 50
        },
        {
          course: course._id,
          title: 'Core Concepts',
          description: 'Understanding the fundamentals',
          order: 2,
          type: 'theory',
          content: '# Core Concepts\n\nThis lesson covers the fundamental concepts...',
          isLocked: true,
          requiredLessons: [],
          xpReward: 75
        },
        {
          course: course._id,
          title: 'Practice Quiz',
          description: 'Test your knowledge',
          order: 3,
          type: 'quiz',
          questions: [
            {
              question: 'What is the main purpose of this technology?',
              type: 'mcq',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 0,
              explanation: 'The correct answer is Option A because...',
              points: 10
            }
          ],
          passingScore: 70,
          isLocked: true,
          xpReward: 100
        },
        {
          course: course._id,
          title: 'Coding Challenge',
          description: 'Apply what you learned',
          order: 4,
          type: 'coding',
          codingProblem: {
            title: 'Build a Simple Function',
            description: 'Create a function that solves the given problem',
            difficulty: 'easy',
            starterCode: new Map([
              ['javascript', 'function solve() {\n  // Your code here\n}'],
              ['python', 'def solve():\n    # Your code here\n    pass']
            ]),
            testCases: [
              { input: '5', expectedOutput: '25', isHidden: false },
              { input: '10', expectedOutput: '100', isHidden: false }
            ],
            constraints: ['Input will be a positive integer'],
            hints: ['Think about mathematical operations']
          },
          isLocked: true,
          xpReward: 150
        },
        {
          course: course._id,
          title: 'Final Test',
          description: 'Complete the course assessment',
          order: 5,
          type: 'final-test',
          questions: [
            {
              question: 'Comprehensive question about the course',
              type: 'mcq',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 2,
              explanation: 'Detailed explanation',
              points: 20
            }
          ],
          passingScore: 80,
          isLocked: true,
          xpReward: 200
        }
      ];

      for (const lessonData of lessons) {
        await Lesson.create(lessonData);
      }

      console.log(`Created ${lessons.length} lessons for ${course.title}`);
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedCourses();