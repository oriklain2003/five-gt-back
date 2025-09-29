import express from 'express';
import { getDb } from '../config/firebase';
import * as createCsvWriter from 'csv-writer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Export courses and points as CSV
router.get('/csv', async (req, res) => {
  try {
    const { format = 'both' } = req.query; // 'courses', 'points', or 'both'
    
    // Create temporary directory for CSV files
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const coursesFile = path.join(tempDir, `courses_${timestamp}.csv`);
    const pointsFile = path.join(tempDir, `points_${timestamp}.csv`);
    
    const db = getDb();
    
    // Fetch all courses
    const coursesSnapshot = await db.collection('courses').get();
    const courses: any[] = [];
    const allPoints: any[] = [];
    
    // Collect courses and points data
    for (const courseDoc of coursesSnapshot.docs) {
      const courseData = courseDoc.data();
      courses.push({
        course_id: courseDoc.id,
        object_type: courseData.object_type,
        mode: courseData.mode,
        noise_level: courseData.noise_level || 0,
        total_distance: courseData.total_distance,
        avg_speed: courseData.avg_speed,
        total_speed_changes: courseData.total_speed_changes,
        total_direction_changes: courseData.total_direction_changes,
        total_altitude_changes: courseData.total_altitude_changes,
        starting_point_lat: courseData.starting_point?.lat || 0,
        starting_point_lon: courseData.starting_point?.lon || 0,
        ending_point_lat: courseData.ending_point?.lat || 0,
        ending_point_lon: courseData.ending_point?.lon || 0,
        created_by: courseData.created_by || 'anonymous'
      });
      
      // Fetch points for this course
      const pointsSnapshot = await db.collection('courses')
        .doc(courseDoc.id)
        .collection('points')
        .orderBy('timestamp', 'asc')
        .get();
      
      pointsSnapshot.docs.forEach(pointDoc => {
        const pointData = pointDoc.data();
        allPoints.push({
          course_id: courseDoc.id,
          point_id: pointDoc.id,
          object_type: courseData.object_type, // Add object type to each point
          lat: pointData.lat,
          lon: pointData.lon,
          altitude: pointData.altitude,
          timestamp: pointData.timestamp?.toDate?.()?.toISOString() || pointData.timestamp
        });
      });
    }
    
    const files = [];
    
    // Create courses CSV if requested
    if (format === 'courses' || format === 'both') {
        const coursesCsvWriter = createCsvWriter.createObjectCsvWriter({
          path: coursesFile,
          header: [
            { id: 'course_id', title: 'course_id' },
            { id: 'object_type', title: 'object_type' },
            { id: 'mode', title: 'mode' },
            { id: 'noise_level', title: 'noise_level' },
            { id: 'total_distance', title: 'total_distance' },
            { id: 'avg_speed', title: 'avg_speed' },
            { id: 'total_speed_changes', title: 'total_speed_changes' },
            { id: 'total_direction_changes', title: 'total_direction_changes' },
            { id: 'total_altitude_changes', title: 'total_altitude_changes' },
            { id: 'starting_point_lat', title: 'starting_point_lat' },
            { id: 'starting_point_lon', title: 'starting_point_lon' },
            { id: 'ending_point_lat', title: 'ending_point_lat' },
            { id: 'ending_point_lon', title: 'ending_point_lon' },
            { id: 'created_by', title: 'created_by' }
          ]
        });
      
      await coursesCsvWriter.writeRecords(courses);
      files.push({ name: 'courses.csv', path: coursesFile });
    }
    
    // Create points CSV if requested
    if (format === 'points' || format === 'both') {
      const pointsCsvWriter = createCsvWriter.createObjectCsvWriter({
        path: pointsFile,
        header: [
          { id: 'course_id', title: 'course_id' },
          { id: 'point_id', title: 'point_id' },
          { id: 'object_type', title: 'object_type' },
          { id: 'lat', title: 'lat' },
          { id: 'lon', title: 'lon' },
          { id: 'altitude', title: 'altitude' },
          { id: 'timestamp', title: 'timestamp' }
        ]
      });
      
      await pointsCsvWriter.writeRecords(allPoints);
      files.push({ name: 'points.csv', path: pointsFile });
    }
    
    // Return file download links
    res.json({
      message: 'CSV files generated successfully',
      files: files.map(file => ({
        name: file.name,
        download_url: `/api/export/download/${path.basename(file.path)}`
      })),
      stats: {
        total_courses: courses.length,
        total_points: allPoints.length
      }
    });
    
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ error: 'Failed to generate CSV files' });
  }
});

// Download CSV file
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../temp', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      } else {
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 60000); // Delete after 1 minute
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Submit testing session result
router.post('/testing-session', async (req, res) => {
  try {
    const { course_id, selected_object_type, correct_object_type } = req.body;
    
    if (!course_id || !selected_object_type || !correct_object_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const is_correct = selected_object_type === correct_object_type;
    
    const sessionData = {
      course_id,
      selected_object_type,
      correct_object_type,
      is_correct,
      answered_at: new Date()
    };
    
    const db = getDb();
    await db.collection('testing_sessions').add(sessionData);
    
    res.json({
      ...sessionData,
      message: is_correct ? 'Correct!' : 'Incorrect. Try again!'
    });
  } catch (error) {
    console.error('Error saving testing session:', error);
    res.status(500).json({ error: 'Failed to save testing session' });
  }
});

// Get testing session statistics
router.get('/testing-stats', async (req, res) => {
  try {
    const db = getDb();
    const sessionsSnapshot = await db.collection('testing_sessions').get();
    const sessions = sessionsSnapshot.docs.map(doc => doc.data());
    
    const stats = {
      total_sessions: sessions.length,
      correct_answers: sessions.filter(s => s.is_correct).length,
      accuracy: sessions.length > 0 ? (sessions.filter(s => s.is_correct).length / sessions.length * 100).toFixed(2) : 0,
      by_object_type: {}
    };
    
    // Calculate accuracy by object type
    const objectTypes = [...new Set(sessions.map((s: any) => s.correct_object_type))];
    objectTypes.forEach(type => {
      const typeSessions = sessions.filter((s: any) => s.correct_object_type === type);
      const typeCorrect = typeSessions.filter((s: any) => s.is_correct).length;
      (stats.by_object_type as any)[type] = {
        total: typeSessions.length,
        correct: typeCorrect,
        accuracy: typeSessions.length > 0 ? (typeCorrect / typeSessions.length * 100).toFixed(2) : 0
      };
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching testing stats:', error);
    res.status(500).json({ error: 'Failed to fetch testing statistics' });
  }
});

export default router;
