import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment';
import Certificate from '../models/Certificate';
import Course from '../models/Course';
import User from '../models/User';
export const enrollCourse = async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const existing = await Enrollment.findOne({ userId, courseId });
    if (existing) return res.status(200).json(existing);
    const lessonProgress = course.lessons.map((l: any) => ({ lessonId: l._id, completed: false, watchedSeconds: 0 }));
    const enrollment = await Enrollment.create({ userId, courseId, lessonProgress, overallProgress: 0 });
    res.status(201).json(enrollment);
  } catch (err) { res.status(500).json({ message: 'Enrollment failed', error: err }); }
};
export const getMyEnrollments = async (req: Request, res: Response) => {
  try { const enrollments = await Enrollment.find({ userId: req.params.userId }).populate('courseId'); res.json(enrollments); }
  catch (err) { res.status(500).json({ message: 'Failed to fetch enrollments', error: err }); }
};
export const getEnrollment = async (req: Request, res: Response) => {
  try { const enrollment = await Enrollment.findOne({ userId: req.params.userId, courseId: req.params.courseId }).populate('courseId'); if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' }); res.json(enrollment); }
  catch (err) { res.status(500).json({ message: 'Failed to fetch enrollment', error: err }); }
};
export const updateLessonProgress = async (req: Request, res: Response) => {
  try {
    const { enrollmentId, userId, courseId, lessonId, watchedSeconds } = req.body;
    const enrollment = enrollmentId ? await Enrollment.findById(enrollmentId) : await Enrollment.findOne({ userId, courseId });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    const lessonObjId = new mongoose.Types.ObjectId(lessonId);
    const existing = enrollment.lessonProgress.find((l) => l.lessonId.toString() === lessonId);
    if (existing) { existing.watchedSeconds = watchedSeconds || existing.watchedSeconds; existing.completed = true; existing.completedAt = new Date(); }
    else { enrollment.lessonProgress.push({ lessonId: lessonObjId, completed: true, watchedSeconds: watchedSeconds || 0, completedAt: new Date() }); }
    const course = await Course.findById(enrollment.courseId);
    if (course) { const total = course.lessons.length; const done = enrollment.lessonProgress.filter((l) => l.completed).length; enrollment.overallProgress = total > 0 ? (done / total) * 100 : 0; if (enrollment.overallProgress >= 100 && !enrollment.completedAt) enrollment.completedAt = new Date(); }
    await enrollment.save(); res.json(enrollment);
  } catch (err) { res.status(500).json({ message: 'Failed to update progress', error: err }); }
};
export const issueCertificate = async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params; const { userId: bodyUserId } = req.body;
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.overallProgress < 100) return res.status(400).json({ message: 'Course not completed yet' });
    const userId = bodyUserId || enrollment.userId.toString();
    if (enrollment.certificateIssued && enrollment.certificateId) { const existing = await Certificate.findById(enrollment.certificateId); if (existing) return res.json(existing); }
    const user = await User.findById(userId); const course = await Course.findById(enrollment.courseId);
    if (!user || !course) return res.status(404).json({ message: 'User or course not found' });
    const certNumber = 'CAMS-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const cert = await Certificate.create({ userId, courseId: enrollment.courseId, enrollmentId, userName: user.name || user.email, courseName: course.title, certificateNumber: certNumber, downloadable: course.certificateIncluded });
    enrollment.certificateIssued = true; enrollment.certificateId = cert._id as mongoose.Types.ObjectId; await enrollment.save();
    res.status(201).json(cert);
  } catch (err) { res.status(500).json({ message: 'Failed to issue certificate', error: err }); }
};
export const purchaseCertificate = async (req: Request, res: Response) => {
  try { const cert = await Certificate.findByIdAndUpdate(req.params.certificateId, { downloadable: true, purchasedAt: new Date() }, { new: true }); if (!cert) return res.status(404).json({ message: 'Certificate not found' }); res.json(cert); }
  catch (err) { res.status(500).json({ message: 'Failed to process purchase', error: err }); }
};
