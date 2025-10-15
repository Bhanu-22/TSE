import { NextRequest, NextResponse } from 'next/server';  
import { Octokit } from '@octokit/rest';  
  
export async function POST(request: NextRequest) {  
  try {  
    const { configuration, branchName } = await request.json();  
      
    const octokit = new Octokit({  
      auth: process.env.GITHUB_TOKEN  
    });  
  
    const owner = process.env.GITHUB_OWNER!;  
    const repo = process.env.GITHUB_REPO!;  
  
    // 1. Get repository info to find default branch AND repo ID  
    const { data: repoInfo } = await octokit.repos.get({  
      owner,  
      repo  
    });  
      
    const repoId = repoInfo.id;  
    const defaultBranch = repoInfo.default_branch;  
      
    // 2. Get the default branch reference  
    const { data: mainBranch } = await octokit.git.getRef({  
      owner,  
      repo,  
      ref: `heads/${defaultBranch}`  
    });  
  
    // 3. Get the current configurationService.ts content from default branch  
    const configPath = 'src/services/configurationService.ts';  
    const { data: fileData } = await octokit.repos.getContent({  
      owner,  
      repo,  
      path: configPath,  
      ref: defaultBranch  // Get from default branch, not the new branch  
    });  
  
    if (!('content' in fileData)) {  
      throw new Error('Could not retrieve file content');  
    }  
  
    // 4. Prepare the updated content  
    let content = Buffer.from(fileData.content, 'base64').toString();  
    const configString = JSON.stringify(configuration, null, 2);  
    content = content.replace(  
      /export const DEFAULT_CONFIG: ConfigurationData = \{[\s\S]*?\};/,  
      `export const DEFAULT_CONFIG: ConfigurationData = ${configString};`  
    );  
  
    // 5. Get the tree of the default branch  
    const { data: baseTree } = await octokit.git.getTree({  
      owner,  
      repo,  
      tree_sha: mainBranch.object.sha,  
      recursive: 'true'  
    });  
  
    // 6. Create a new blob with the updated file content  
    const { data: newBlob } = await octokit.git.createBlob({  
      owner,  
      repo,  
      content: Buffer.from(content).toString('base64'),  
      encoding: 'base64'  
    });  
  
    // 7. Create a new tree with the updated file  
    const { data: newTree } = await octokit.git.createTree({  
      owner,  
      repo,  
      base_tree: baseTree.sha,  
      tree: [  
        {  
          path: configPath,  
          mode: '100644',  
          type: 'blob',  
          sha: newBlob.sha  
        }  
      ]  
    });  
  
    // 8. Create a commit with the new tree  
    const { data: newCommit } = await octokit.git.createCommit({  
      owner,  
      repo,  
      message: `Bake configuration for deployment: ${branchName}`,  
      tree: newTree.sha,  
      parents: [mainBranch.object.sha]  
    });  
  
    // 9. Create the new branch pointing to the new commit  
    await octokit.git.createRef({  
      owner,  
      repo,  
      ref: `refs/heads/${branchName}`,  
      sha: newCommit.sha  
    });  
  
    // 5. Trigger Vercel deployment with preview target  
    const vercelResponse = await fetch('https://api.vercel.com/v13/deployments', {  
      method: 'POST',  
      headers: {  
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        name: process.env.VERCEL_PROJECT_ID,  
        gitSource: {  
          type: 'github',  
          repo: `${owner}/${repo}`,  
          ref: branchName,  
          repoId: repoId  
        },  
      })  
    });  
    
    if (!vercelResponse.ok) {  
    const errorData = await vercelResponse.json();  
    console.error('Vercel deployment failed:', errorData);  
    throw new Error(`Vercel deployment failed: ${errorData.error?.message || 'Unknown error'}`);  
    }  
    
    const deployment = await vercelResponse.json();  
    console.log('Vercel deployment response:', deployment);  
    
    // 6. Poll for deployment completion  
    let deploymentUrl = null;  
    const maxAttempts = 60;  
    let attempts = 0;  
    
    while (attempts < maxAttempts) {  
    const statusResponse = await fetch(  
        `https://api.vercel.com/v13/deployments/${deployment.id}`,  
        {  
        headers: {  
            'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`  
        }  
        }  
    );  
    
    const statusData = await statusResponse.json();  
        
    if (statusData.readyState === 'READY') {  
        // Get base URL  
        const baseUrl = statusData.url   
        ? `https://${statusData.url}`   
        : statusData.alias?.[0]  
            ? `https://${statusData.alias[0]}`  
            : null;  
        
        // Create shareable link  
        if (baseUrl) {  
        try {  
            const shareResponse = await fetch(  
            `https://api.vercel.com/v1/deployments/${deployment.id}/share`,  
            {  
                method: 'POST',  
                headers: {  
                'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`  
                }  
            }  
            );  
            
            if (shareResponse.ok) {  
            const shareData = await shareResponse.json();  
            deploymentUrl = `${baseUrl}?_vercel_share=${shareData.token}`;  
            } else {  
            deploymentUrl = baseUrl;  
            }  
        } catch (error) {  
            console.error('Failed to create share link:', error);  
            deploymentUrl = baseUrl;  
        }  
        }  
        break;  
    } else if (statusData.readyState === 'ERROR' || statusData.readyState === 'CANCELED') {  
        throw new Error(`Deployment failed with state: ${statusData.readyState}`);  
    }  
    
    await new Promise(resolve => setTimeout(resolve, 5000));  
    attempts++;  
    }  
    
    return NextResponse.json({  
    success: true,  
    branchUrl: `https://github.com/${owner}/${repo}/tree/${branchName}`,  
    deploymentUrl,  
    deploymentId: deployment.id  
    });  
  
  } catch (error) {  
    console.error('Publish deployment error:', error);  
    return NextResponse.json({  
      success: false,  
      error: error instanceof Error ? error.message : 'Unknown error'  
    }, { status: 500 });  
  }  
}