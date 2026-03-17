const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const certificateGenerator = require('../services/certificateGenerator');
const judge0Service = require('../services/judge0Service');

// Get all courses with progress
router.get('/courses', auth, async (req, res) => {
  try {
    const courses = await Course.find().sort({ order: 1 });
    
    // Get user progress for each course
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        const progress = await Progress.findOne({
          user: req.user.id,
          course: course._id
        });

        return {
          ...course.toObject(),
          progress: progress ? progress.percentage : 0,
          status: progress ? progress.status : 'not-started',
          isUnlocked: course.order <= 10 || (progress && progress.percentage > 0)
        };
      })
    );

    res.json(coursesWithProgress);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course details with lessons
router.get('/courses/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });
    
    const progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    // Determine which lessons are unlocked
    const lessonsWithStatus = lessons.map((lesson, index) => {
      const isUnlocked = index === 0 || 
        (progress && progress.completedModules.some(m => m.moduleIndex === index - 1));

      const isCompleted = progress && 
        progress.completedModules.some(m => m.moduleIndex === index);

      return {
        ...lesson.toObject(),
        isUnlocked,
        isCompleted
      };
    });

    res.json({
      course,
      lessons: lessonsWithStatus,
      progress: progress || {
        percentage: 0,
        currentModule: 0,
        status: 'not-started'
      }
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get lesson details
router.get('/lessons/:lessonId', auth, async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      course: lesson.course._id
    });

    // Check if lesson is unlocked
    const lessonIndex = await Lesson.countDocuments({
      course: lesson.course._id,
      order: { $lt: lesson.order }
    });

    const isUnlocked = lessonIndex === 0 || 
      (progress && progress.completedModules.some(m => m.moduleIndex === lessonIndex - 1));

    if (!isUnlocked) {
      return res.status(403).json({ message: 'Lesson is locked' });
    }

    res.json(lesson);
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete lesson
router.post('/lessons/:lessonId/complete', auth, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { score, timeTaken } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    let progress = await Progress.findOne({
      user: req.user.id,
      course: lesson.course
    });

    if (!progress) {
      progress = new Progress({
        user: req.user.id,
        course: lesson.course,
        status: 'in-progress'
      });
    }

    // Get lesson index
    const lessonIndex = await Lesson.countDocuments({
      course: lesson.course,
      order: { $lt: lesson.order }
    });

    // Check if already completed
    const alreadyCompleted = progress.completedModules.some(
      m => m.moduleIndex === lessonIndex
    );

    if (!alreadyCompleted) {
      progress.completedModules.push({
        moduleIndex: lessonIndex,
        completedAt: new Date(),
        score: score || 0
      });

      // Update current module
      progress.currentModule = lessonIndex + 1;

      // Award XP
      const xpEarned = lesson.xpReward || 50;
      progress.xpEarned += xpEarned;

      // Update user XP
      const user = await User.findById(req.user.id);
      user.xp += xpEarned;
      await user.save();
    }

    // Calculate progress percentage
    const totalLessons = await Lesson.countDocuments({ course: lesson.course });
    progress.percentage = Math.round((progress.completedModules.length / totalLessons) * 100);

    // Check if course completed
    if (progress.percentage === 100 && !progress.certificateEarned) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.certificateEarned = true;

      // Generate certificate
      const course = await Course.findById(lesson.course);
      const user = await User.findById(req.user.id);

      const certificateData = await certificateGenerator.generateCourseCertificate(
        { name: user.name },
        { title: course.title },
        { grade: score >= 90 ? 'Distinction' : score >= 75 ? 'Merit' : 'Pass' }
      );

      const certificate = new Certificate({
        user: req.user.id,
        course: lesson.course,
        title: `${course.title} Completion`,
        description: `Successfully completed ${course.title}`,
        certificateId: certificateData.certificateId,
        imageUrl: certificateData.fileUrl,
        verificationUrl: certificateData.verificationUrl,
        grade: score >= 90 ? 'Distinction' : score >= 75 ? 'Merit' : 'Pass',
        xpEarned: progress.xpEarned
      });

      await certificate.save();

      // Add to user certificates
      user.certificates.push(certificate._id);
      user.completedCourses.push(lesson.course);
      await user.save();
    }

    await progress.save();

    res.json({
      success: true,
      progress,
      xpEarned: lesson.xpReward || 50
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit quiz answer for lesson
router.post('/lessons/:lessonId/quiz', auth, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { answers } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.type !== 'quiz') {
      return res.status(404).json({ message: 'Quiz lesson not found' });
    }

    // Calculate score
    let correctCount = 0;
    const results = lesson.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
      if (isCorrect) correctCount++;

      return {
        questionIndex: index,
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      };
    });

    const score = Math.round((correctCount / lesson.questions.length) * 100);
    const passed = score >= (lesson.passingScore || 70);

    res.json({
      score,
      passed,
      correctCount,
      totalQuestions: lesson.questions.length,
      results
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit coding solution for lesson
router.post('/lessons/:lessonId/code', auth, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { code, language } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.type !== 'coding') {
      return res.status(404).json({ message: 'Coding lesson not found' });
    }

    // Execute code with test cases
    const result = await judge0Service.executeWithTestCases(
      code,
      language,
      lesson.codingProblem.testCases,
      'course'
    );

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Submit code error:', error);
    res.status(500).json({ message: 'Code execution failed' });
  }
});

// Get user certificates
router.get('/certificates', auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user.id })
      .populate('course')
      .sort({ issuedAt: -1 });

    res.json(certificates);
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;