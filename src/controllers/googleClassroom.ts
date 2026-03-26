import { Request, Response } from 'express';
import { google } from 'googleapis';
import Course from '../models/Course';
const SCOPES = ['https://www.googleapis.com/auth/classroom.courses.readonly','https://www.googleapis.com/auth/classroom.coursework.students.readonly','https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly','https://www.googleapis.com/auth/classroom.topics.readonly','https://www.googleapis.com/auth/drive.readonly','profile','email'];
function getOAuth2Client() { return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback'); }
const tokenStore: Record<string, any> = {};
export const getGoogleAuthUrl = (req: Request, res: Response) => {
  const { userId } = req.query;
  const url = getOAuth2Client().generateAuthUrl({ access_type: 'offline', scope: SCOPES, state: String(userId || 'admin'), prompt: 'consent' });
  res.json({ url });
};
export const googleCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try { const { tokens } = await getOAuth2Client().getToken(String(code)); tokenStore[String(state)] = tokens; res.redirect(clientUrl + '/admin?tab=import&auth=success&userId=' + state); }
  catch (err: any) { res.redirect(clientUrl + '/admin?tab=import&auth=error&msg=' + encodeURIComponent(err.message)); }
};
export const listGoogleCourses = async (req: Request, res: Response) => {
  const tokens = tokenStore[String(req.query.userId)];
  if (!tokens) return res.status(401).json({ message: 'Not authenticated with Google.' });
  try {
    const oauth2Client = getOAuth2Client(); oauth2Client.setCredentials(tokens);
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    const response = await classroom.courses.list({ teacherId: 'me', courseStates: ['ACTIVE'] });
    res.json((response.data.courses || []).map((c: any) => ({ id: c.id, name: c.name, description: c.descriptionHeading || c.description || '', section: c.section || '' })));
  } catch (err: any) { res.status(500).json({ message: 'Failed to fetch courses', error: err.message }); }
};
export const importGoogleCourses = async (req: Request, res: Response) => {
  const { userId, courseIds } = req.body;
  const tokens = tokenStore[String(userId)];
  if (!tokens) return res.status(401).json({ message: 'Not authenticated with Google.' });
  try {
    const oauth2Client = getOAuth2Client(); oauth2Client.setCredentials(tokens);
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    const imported: string[] = []; const errors: string[] = [];
    for (const gcCourseId of courseIds) {
      try {
        const courseRes = await classroom.courses.get({ id: gcCourseId });
        const gc = courseRes.data;
        let courseWork: any[] = []; let materials: any[] = [];
        try { const cwRes = await classroom.courses.courseWork.list({ courseId: gcCourseId }); courseWork = cwRes.data.courseWork || []; } catch {}
        try { const matRes = await classroom.courses.courseWorkMaterials.list({ courseId: gcCourseId }); materials = matRes.data.courseWorkMaterial || []; } catch {}
        const allItems = [...courseWork.map((cw: any) => ({...cw,_type:'coursework'})),...materials.map((m: any) => ({...m,_type:'material'}))].sort((a: any,b: any) => a.creationTime > b.creationTime ? 1 : -1);
        const lessons = allItems.map((item: any, idx: number) => {
          const lesson: any = { title: item.title || 'Lesson '+(idx+1), description: item.description || '', order: idx+1, duration: 30, resources: [] };
          for (const mat of (item.materials || [])) {
            if (mat.youtubeVideo) lesson.embedUrl = 'https://www.youtube.com/embed/' + mat.youtubeVideo.id;
            else if (mat.driveFile) { const fileId = mat.driveFile.driveFile?.id; const title = mat.driveFile.driveFile?.title || 'Resource'; if (fileId) { const ext = (title.split('.').pop()||'').toLowerCase(); if (['mp4','mov','avi','mkv','webm'].includes(ext)) lesson.videoUrl = 'https://drive.google.com/file/d/'+fileId+'/preview'; else lesson.resources.push({ title, url: 'https://drive.google.com/file/d/'+fileId+'/view' }); } }
            else if (mat.link) lesson.resources.push({ title: mat.link.title||'Link', url: mat.link.url });
          }
          return lesson;
        });
        const slug = (gc.name||'course').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')+'-gc-'+String(gcCourseId).slice(-6);
        const courseData = { title: gc.name||'Imported Course', slug, description: gc.descriptionHeading||gc.description||gc.name||'', category:'Mathematics', level:'beginner' as const, instructor:'CAMS Team', requiredTier:'basic' as const, certificateIncluded:false, freeEnrollment:true, published:false, lessons, tags:['google-classroom','imported'] };
        const existing = await Course.findOne({ slug });
        if (existing) await Course.findByIdAndUpdate(existing._id, courseData); else await Course.create(courseData);
        imported.push(gc.name || gcCourseId);
      } catch (err: any) { errors.push(gcCourseId+': '+err.message); }
    }
    res.json({ message: 'Imported '+imported.length+' course(s)', imported, errors, note: 'Courses set to Draft — publish from LMS Courses tab.' });
  } catch (err: any) { res.status(500).json({ message: 'Import failed', error: err.message }); }
};
