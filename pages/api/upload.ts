import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Turn off default body parser so formidable can handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure local storage directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB max
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('[Upload Error]', err);
      return res.status(500).json({ error: 'Upload failed' });
    }

    const file = files.file?.[0] || files.file;
    const topic = fields.topic?.[0] || fields.topic || 'general';

    if (Array.isArray(file)) {
      console.log(`[Upload] File saved: ${file[0]?.originalFilename} → ${file[0]?.filepath} [topic: ${topic}]`);
    } else {
      console.log(`[Upload] File saved: ${file?.originalFilename} → ${file?.filepath} [topic: ${topic}]`);
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    return res.status(200).json({
      success: true,
      file: {
        name: Array.isArray(file) ? file[0]?.originalFilename : file?.originalFilename,
        storedAs: path.basename(Array.isArray(file) ? file[0]?.filepath : file?.filepath),
        topic,
      },
    });
  });
}