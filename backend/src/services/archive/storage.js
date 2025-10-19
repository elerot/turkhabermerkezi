const fs = require("fs");
const path = require("path");
const { ARCHIVES_DIR } = require("../../config/constants");

// Create hierarchical archive structure
function createArchiveStructure(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  const yearDir = path.join(ARCHIVES_DIR, year.toString());
  const monthDir = path.join(yearDir, month);

  if (!fs.existsSync(monthDir)) {
    fs.mkdirSync(monthDir, { recursive: true });
  }

  return {
    yearDir,
    monthDir,
    year,
    month,
    day,
    dateKey: `${year}-${month}-${day}`,
    archiveFile: path.join(monthDir, `${day}.json`),
  };
}

// Save article to archive file
function saveArticleToArchive(article) {
  try {
    const date = new Date(article.date_key + "T00:00:00Z");
    const { archiveFile } = createArchiveStructure(date);

    // Read existing articles for this date
    let existingArticles = [];
    if (fs.existsSync(archiveFile)) {
      try {
        const data = fs.readFileSync(archiveFile, "utf8");
        existingArticles = JSON.parse(data);
      } catch (parseError) {
        console.error(`⚠️ Corrupt archive file detected: ${archiveFile}`);
        console.error(`   Error: ${parseError.message}`);
        console.error(`   Creating backup and starting fresh...`);
        
        // Bozuk dosyayı backup'la
        const backupFile = archiveFile.replace('.json', `.corrupt-${Date.now()}.json`);
        try {
          fs.renameSync(archiveFile, backupFile);
          console.log(`   ✅ Backup saved: ${backupFile}`);
        } catch (backupError) {
          console.error(`   ❌ Backup failed, deleting corrupt file...`);
          fs.unlinkSync(archiveFile);
        }
        
        // Fresh start with empty array
        existingArticles = [];
      }
    }

    // Check if article already exists (by content_hash)
    const exists = existingArticles.some(existing => existing.content_hash === article.content_hash);
    if (exists) {
      return false; // Article already exists
    }

    // Add new article
    existingArticles.push(article);
    
    // Sort by created_at (newest first)
    existingArticles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Save to archive file
    fs.writeFileSync(archiveFile, JSON.stringify(existingArticles, null, 2));

    // Update summary files
    const { updateArchiveSummaries } = require("./summary");
    updateArchiveSummaries(article.date_key);

    return true; // Article was added
  } catch (error) {
    console.error("Error saving article to archive:", error);
    return false;
  }
}

module.exports = {
  createArchiveStructure,
  saveArticleToArchive,
};

