import express from 'express';
import { getDb } from '../config/firebase';
import { Point } from '../models/types';

const router = express.Router();

// Get points for a specific course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const db = getDb();
    const snapshot = await db.collection('courses')
      .doc(courseId)
      .collection('points')
      .orderBy('timestamp', 'asc')
      .get();
    
    const points = snapshot.docs.map(doc => ({
      point_id: doc.id,
      ...doc.data()
    }));
    
    res.json(points);
  } catch (error) {
    console.error('Error fetching points:', error);
    res.status(500).json({ error: 'Failed to fetch points' });
  }
});

// Add point to a course
router.post('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lat, lon, altitude, timestamp }: Omit<Point, 'point_id'> = req.body;
    
    if (!lat || !lon || altitude === undefined || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const db = getDb();
    
    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Generate point ID
    const pointsSnapshot = await db.collection('courses')
      .doc(courseId)
      .collection('points')
      .get();
    
    const point_id = `p${pointsSnapshot.size + 1}`;
    
    const pointData: Point = {
      point_id,
      lat,
      lon,
      altitude,
      timestamp: new Date(timestamp)
    };
    
    await db.collection('courses')
      .doc(courseId)
      .collection('points')
      .doc(point_id)
      .set(pointData);
    
    res.status(201).json(pointData);
  } catch (error) {
    console.error('Error adding point:', error);
    res.status(500).json({ error: 'Failed to add point' });
  }
});

// Update a specific point
router.put('/course/:courseId/:pointId', async (req, res) => {
  try {
    const { courseId, pointId } = req.params;
    const { lat, lon, altitude, timestamp } = req.body;
    
    const db = getDb();
    const pointRef = db.collection('courses')
      .doc(courseId)
      .collection('points')
      .doc(pointId);
    
    const pointDoc = await pointRef.get();
    if (!pointDoc.exists) {
      return res.status(404).json({ error: 'Point not found' });
    }
    
    const updateData: Partial<Point> = {};
    if (lat !== undefined) updateData.lat = lat;
    if (lon !== undefined) updateData.lon = lon;
    if (altitude !== undefined) updateData.altitude = altitude;
    if (timestamp) updateData.timestamp = new Date(timestamp);
    
    await pointRef.update(updateData);
    
    const updatedPoint = await pointRef.get();
    res.json({
      point_id: updatedPoint.id,
      ...updatedPoint.data()
    });
  } catch (error) {
    console.error('Error updating point:', error);
    res.status(500).json({ error: 'Failed to update point' });
  }
});

// Delete a specific point
router.delete('/course/:courseId/:pointId', async (req, res) => {
  try {
    const { courseId, pointId } = req.params;
    
    const db = getDb();
    await db.collection('courses')
      .doc(courseId)
      .collection('points')
      .doc(pointId)
      .delete();
    
    res.json({ message: 'Point deleted successfully' });
  } catch (error) {
    console.error('Error deleting point:', error);
    res.status(500).json({ error: 'Failed to delete point' });
  }
});

export default router;
