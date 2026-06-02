const fs = require('fs');
const path = require('path');

/**
 * Helper to delete a single file by its URL or relative path
 * @param {string} fileUrl e.g. "/assets/students/student-123.jpg"
 */
const deleteFileByUrl = (fileUrl) => {
  if (!fileUrl) return;
  try {
    // Assuming fileUrl starts with '/assets/'
    if (fileUrl.startsWith('/assets/')) {
      const relativePath = fileUrl.replace('/assets/', 'assets/');
      const absolutePath = path.join(__dirname, '..', relativePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log(`[FILE CLEANUP] Deleted: ${absolutePath}`);
      }
    }
  } catch (err) {
    console.error(`[FILE CLEANUP] Error deleting ${fileUrl}:`, err);
  }
};

/**
 * Helper to delete an array of file URLs
 */
const deleteFiles = (fileUrls) => {
  if (!Array.isArray(fileUrls)) return;
  fileUrls.forEach(deleteFileByUrl);
};

module.exports = {
  deleteFileByUrl,
  deleteFiles
};
