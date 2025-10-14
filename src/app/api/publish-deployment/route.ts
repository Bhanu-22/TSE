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
    
    const repoId = repoInfo.id; // GitHub's numeric repository ID  
    const defaultBranch = repoInfo.default_branch;  
    
    // 2. Get the default branch reference  
    const { data: mainBranch } = await octokit.git.getRef({  
    owner,  
    repo,  
    ref: `heads/${defaultBranch}`  
    });   
  
    // 3. Create new branch  
    await octokit.git.createRef({  
      owner,  
      repo,  
      ref: `refs/heads/${branchName}`,  
      sha: mainBranch.object.sha  
    });  
  
    // 4. Update DEFAULT_CONFIG in configurationService.ts  
    const configPath = 'src/services/configurationService.ts';  
    const { data: fileData } = await octokit.repos.getContent({  
      owner,  
      repo,  
      path: configPath,  
      ref: branchName  
    });  
  
    if ('content' in fileData) {  
      let content = Buffer.from(fileData.content, 'base64').toString();  
        
      const configString = JSON.stringify(configuration, null, 2);  
      content = content.replace(  
        /export const DEFAULT_CONFIG: ConfigurationData = \{[\s\S]*?\};/,  
        `export const DEFAULT_CONFIG: ConfigurationData = ${configString};`  
      );  
  
      await octokit.repos.createOrUpdateFileContents({  
        owner,  
        repo,  
        path: configPath,  
        message: `Bake configuration for deployment: ${branchName}`,  
        content: Buffer.from(content).toString('base64'),  
        branch: branchName,  
        sha: fileData.sha  
      });  
    }  
  
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