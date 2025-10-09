import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {  
  try {  
    const { filename, content, commitMessage } = await request.json();  
      
    // Validate inputs  
    if (!filename || !content || !commitMessage) {  
      return NextResponse.json(  
        { error: 'Missing required fields' },  
        { status: 400 }  
      );  
    }  
  
    // Ensure filename is safe (only JSON in saved-configs directory)  
    if (!filename.endsWith('.json') || filename.includes('..') || filename.includes('/')) {  
      return NextResponse.json(  
        { error: 'Invalid filename. Must be a .json file without path separators' },  
        { status: 400 }  
      );  
    }  
  
    const token = process.env.GITHUB_TOKEN;  
    const owner = process.env.GITHUB_REPO_OWNER;  
    const repo = process.env.GITHUB_REPO_NAME;  
    const configPath = process.env.GITHUB_CONFIG_PATH || 'saved-configs';  
  
    if (!token || !owner || !repo) {  
      return NextResponse.json(  
        { error: 'GitHub configuration missing' },  
        { status: 500 }  
      );  
    }  
  
    const path = `${configPath}/${filename}`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
    // Get current file SHA if it exists (for updates)  
    let sha: string | undefined;  
    try {  
      const getResponse = await fetch(apiUrl, {  
        headers: {  
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });  
      if (getResponse.ok) {  
        const data = await getResponse.json();  
        sha = data.sha;  
      }  
    } catch (error) {  
      // File doesn't exist, that's okay for new files  
    }  
  
    // Create or update file  
    const response = await fetch(apiUrl, {  
      method: 'PUT',  
      headers: {  
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({  
        message: commitMessage,  
        content: Buffer.from(content).toString('base64'),  
        ...(sha && { sha }), // Include SHA for updates  
      }),  
    });  
  
    if (!response.ok) {  
      const error = await response.json();  
      return NextResponse.json(  
        { error: error.message || 'Failed to push to GitHub' },  
        { status: response.status }  
      );  
    }  
  
    const result = await response.json();  
    return NextResponse.json({  
      success: true,  
      commit: result.commit,  
      url: result.content.html_url,  
    });  
  
  } catch (error) {  
    console.error('Error pushing to GitHub:', error);  
    return NextResponse.json(  
      { error: error instanceof Error ? error.message : 'Unknown error' },  
      { status: 500 }  
    );  
  }  
}