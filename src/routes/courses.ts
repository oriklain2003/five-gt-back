import express from 'express';
import { getDb } from '../config/firebase';
import { Course, CreateCourseRequest, UpdateCourseRequest, Point } from '../models/types';
import { calculateCourseMetrics } from '../utils/calculations';

const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const { mode, object_type, limit = 50 } = req.query;
    
    const db = getDb();
    let query = db.collection('courses').orderBy('created_at', 'desc');
    
    if (mode) {
      query = query.where('mode', '==', mode);
    }
    
    if (object_type) {
      query = query.where('object_type', '==', object_type);
    }
    
    query = query.limit(parseInt(limit as string));
    
    const snapshot = await query.get();
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID with points
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDb();
    const courseDoc = await db.collection('courses').doc(id).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get points subcollection
    const pointsSnapshot = await db.collection('courses').doc(id).collection('points').get();
    const points = pointsSnapshot.docs.map(doc => ({
      point_id: doc.id,
      ...doc.data()
    }));
    
    const course = {
      id: courseDoc.id,
      ...courseDoc.data(),
      points
    };
    
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create new course
router.post('/', async (req, res) => {
  try {
    const { object_type, mode, created_by, noise_level = 0, points }: CreateCourseRequest = req.body;
    
    if (!object_type || !mode || !points || points.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (typeof noise_level !== 'number' || noise_level < 0 || noise_level > 100) {
      return res.status(400).json({ error: 'noise_level must be a number between 0 and 100' });
    }
    
    // Convert timestamp strings to Date objects
    const processedPoints: Point[] = points.map((point, index) => ({
      ...point,
      point_id: `p${index + 1}`,
      timestamp: new Date(point.timestamp)
    }));
    
    // Calculate metrics
    const metrics = calculateCourseMetrics(processedPoints);
    
    const courseData: Omit<Course, 'id'> = {
      object_type,
      mode,
      created_by: created_by || 'anonymous',
      noise_level,
      ...metrics,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const db = getDb();
    
    // Create course document
    const courseRef = await db.collection('courses').add(courseData);
    
    // Add points to subcollection
    const batch = db.batch();
    processedPoints.forEach(point => {
      const pointRef = db.collection('courses').doc(courseRef.id).collection('points').doc(point.point_id);
      batch.set(pointRef, point);
    });
    await batch.commit();
    
    res.status(201).json({
      id: courseRef.id,
      ...courseData,
      points: processedPoints
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { object_type, mode, noise_level, points }: UpdateCourseRequest = req.body;
    
    const db = getDb();
    const courseRef = db.collection('courses').doc(id);
    const courseDoc = await courseRef.get();
    
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    let updateData: Partial<Course> = {
      updated_at: new Date()
    };
    
    if (object_type) updateData.object_type = object_type;
    if (mode) updateData.mode = mode;
    if (typeof noise_level === 'number' && noise_level >= 0 && noise_level <= 100) {
      updateData.noise_level = noise_level;
    }
    
    // If points are provided, recalculate metrics
    if (points && points.length > 0) {
      const processedPoints = points.map(point => ({
        ...point,
        timestamp: new Date(point.timestamp)
      }));
      
      const metrics = calculateCourseMetrics(processedPoints);
      updateData = { ...updateData, ...metrics };
      
      // Update points subcollection
      const existingPoints = await db.collection('courses').doc(id).collection('points').get();
      const batch = db.batch();
      
      // Delete existing points
      existingPoints.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Add new points
      processedPoints.forEach(point => {
        const pointRef = db.collection('courses').doc(id).collection('points').doc(point.point_id);
        batch.set(pointRef, point);
      });
      
      await batch.commit();
    }
    
    await courseRef.update(updateData);
    
    // Return updated course
    const updatedCourse = await courseRef.get();
    const pointsSnapshot = await db.collection('courses').doc(id).collection('points').get();
    const updatedPoints = pointsSnapshot.docs.map(doc => ({
      point_id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      id: updatedCourse.id,
      ...updatedCourse.data(),
      points: updatedPoints
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDb();
    
    // Delete points subcollection first
    const pointsSnapshot = await db.collection('courses').doc(id).collection('points').get();
    const batch = db.batch();
    
    pointsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete course document
    batch.delete(db.collection('courses').doc(id));
    
    await batch.commit();
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Get random course for testing mode
router.get('/random/testing', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('courses')
      .where('mode', '==', 'training')
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No training courses available' });
    }
    
    const courses = snapshot.docs;
    const randomCourse = courses[Math.floor(Math.random() * courses.length)];
    
    // Get points for the random course
    const pointsSnapshot = await db.collection('courses')
      .doc(randomCourse.id)
      .collection('points')
      .get();
    
    const points = pointsSnapshot.docs.map(doc => ({
      point_id: doc.id,
      ...doc.data()
    }));
    
    // Return course without object_type for testing
    const courseData = randomCourse.data();
    const { object_type, ...courseWithoutType } = courseData;
    
    res.json({
      id: randomCourse.id,
      ...courseWithoutType,
      points,
      correct_object_type: object_type // Hidden field for validation
    });
  } catch (error) {
    console.error('Error fetching random course:', error);
    res.status(500).json({ error: 'Failed to fetch random course' });
  }
});

export default router;
