const express = require('express');
const { Octokit } = require('@octokit/rest');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

// --- CONFIGURATION ---
// For security, load these from environment variables, not hardcoded.
// You will need to create a GitHub Personal Access Token (PAT).
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER; // Your GitHub username
const REPO_NAME = process.env.GITHUB_REPO_NAME;   // The name of the repository
const REPO_PATH = process.env.GITHUB_REPO_PATH || 'projects'; // Optional: folder within the repo

if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
    console.error("FATAL ERROR: Missing required environment variables (GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME).");
    process.exit(1);
}

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Serve static files (HTML, CSS, JS) from the current directory
app.use(express.static(__dirname));

// Initialize Octokit
const octokit = new Octokit({ auth: GITHUB_TOKEN });

const languageExtensions = {
    javascript: 'js',
    python: 'py',
    java: 'java',
    html: 'html',
    css: 'css',
    text: 'txt'
};

// --- API ENDPOINT ---
app.post('/api/save-to-github', async (req, res) => {
    const { projectName, language, code } = req.body;

    if (!projectName || !language || !code) {
        return res.status(400).json({ message: 'Missing required fields: projectName, language, or code.' });
    }

    const extension = languageExtensions[language.toLowerCase()] || 'txt';
    const fileName = `${projectName.replace(/ /g, '-')}.${extension}`;
    const filePath = `${REPO_PATH}/${fileName}`;
    const commitMessage = `feat: Add new project - ${projectName}`;

    try {
        // Convert file content to Base64, which is required by the GitHub API
        const contentEncoded = Buffer.from(code).toString('base64');

        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: filePath,
            message: commitMessage,
            content: contentEncoded,
        });

        console.log(`Successfully committed ${filePath} to ${REPO_OWNER}/${REPO_NAME}`);
        res.status(201).json({ message: 'Project saved successfully!', fileName });

    } catch (error) {
        console.error('GitHub API Error:', error.message);
        // Provide a more specific error message if the file already exists
        if (error.status === 422) {
            return res.status(422).json({ message: `A file named "${fileName}" already exists in the repository.` });
        }
        res.status(500).json({ message: 'An error occurred while saving the file to GitHub.' });
    }
});

// --- API ENDPOINT to GET projects ---
app.get('/api/projects', async (req, res) => {
    try {
        const { data: files } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: REPO_PATH,
        });

        if (!Array.isArray(files)) {
            return res.status(200).json([]); // Path might be a file or not exist
        }

        // Map over the file metadata and fetch the raw content for each file
        const projectsPromises = files
            .filter(file => file.type === 'file') // Ensure we only process files
            .map(async (file) => {
                const { data: content } = await octokit.request('GET', file.download_url);
                
                const extension = path.extname(file.name).substring(1);
                const language = Object.keys(languageExtensions).find(key => languageExtensions[key] === extension) || 'text';
                const title = path.basename(file.name, path.extname(file.name)).replace(/-/g, ' ');

                return { title, language, code: content };
            });

        const projects = await Promise.all(projectsPromises);
        res.status(200).json(projects);

    } catch (error) {
        // If the directory doesn't exist yet, it's not an error, just an empty list.
        if (error.status === 404) {
            return res.status(200).json([]);
        }
        console.error('GitHub API Error while fetching projects:', error.message);
        res.status(500).json({ message: 'An error occurred while fetching projects from GitHub.' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`- Saving projects to GitHub repo: ${REPO_OWNER}/${REPO_NAME}`);
    console.log(`- Saving projects in path: /${REPO_PATH}`);
});