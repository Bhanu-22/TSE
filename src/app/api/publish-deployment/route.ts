import { NextRequest, NextResponse } from 'next/server';    
import { Octokit } from '@octokit/rest';    
import { DEFAULT_CONFIG } from '../../../services/configurationService';    
  
// Server-side helper function to load config from GitHub  
async function loadConfigFromGitHubServer(filename: string) {  
  const repoOwner = "Bhanu-22";  
  const repoName = "TSE";  
  const configsPath = "saved-configs";  
  
  const response = await fetch(  
    `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${configsPath}/${filename}`,  
    {  
      method: "GET",  
      headers: {  
        Accept: "application/vnd.github.v3+json",  
        "User-Agent": "TSE-Demo-Builder",  
        "Content-Type": "application/json",  
        Authorization: `token ${process.env.privateRepotk}`,  
      },  
    }  
  );  
  
  if (!response.ok) {  
    throw new Error(`Failed to fetch configuration: ${response.statusText}`);  
  }  
  
  const fileData = await response.json();  
    
  if (!fileData.content) {  
    throw new Error("No content found in GitHub response");  
  }  
  
  // Decode base64 content using Node.js Buffer (server-side)  
  const base64Content = fileData.content.replace(/\n/g, '');  
  const decodedContent = Buffer.from(base64Content, 'base64').toString('utf-8');  
    
  return JSON.parse(decodedContent);  
}  
  
export async function POST(request: NextRequest) {    
  try {    
    const { configuration, branchName, githubFilename } = await request.json();    
        
    let finalConfiguration;    
    
    if (githubFilename) {    
      console.log('Loading configuration from GitHub:', githubFilename);    
      try {    
        // Use the server-side helper function instead of importing from githubApi  
        const configData = await loadConfigFromGitHubServer(githubFilename);    
            
        // Merge with defaults to ensure all required fields exist    
        finalConfiguration = {    
          standardMenus: (configData.standardMenus as any) || DEFAULT_CONFIG.standardMenus,    
          customMenus: (configData.customMenus as any) || DEFAULT_CONFIG.customMenus,    
          menuOrder: (configData.menuOrder as any) || DEFAULT_CONFIG.menuOrder,    
          homePageConfig: (configData.homePageConfig as any) || DEFAULT_CONFIG.homePageConfig,    
          appConfig: (configData.appConfig as any) || DEFAULT_CONFIG.appConfig,    
          fullAppConfig: (configData.fullAppConfig as any) || DEFAULT_CONFIG.fullAppConfig,    
          stylingConfig: (configData.stylingConfig as any) || DEFAULT_CONFIG.stylingConfig,    
          userConfig: (configData.userConfig as any) || DEFAULT_CONFIG.userConfig,    
        };    
      } catch (error) {    
        console.error('Failed to load configuration from GitHub:', error);    
        throw new Error(`Failed to load configuration from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);    
      }    
    } else {    
      // Use configuration from request body (existing behavior)    
      finalConfiguration = configuration;    
    }    
        
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
      ref: defaultBranch    
    });    
    
    if (!('content' in fileData)) {    
      throw new Error('Could not retrieve file content');    
    }    
      
      
    // 4. Prepare the updated content  
    let content = Buffer.from(fileData.content, 'base64').toString();  
    if (!finalConfiguration) {  
      throw new Error('Configuration is undefined - cannot proceed with deployment');  
    }  
     
    // Set disableSettings to true for deployments  
    finalConfiguration.appConfig.disableSettings = true;  
     
    const configString = JSON.stringify(finalConfiguration, null, 2);  
    content = content.replace(  
      /export const DEFAULT_CONFIG: ConfigurationData = (?:\{[\s\S]*?\}|undefined);/,  
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
        
    // 7. Create a new tree with the updated file and deleted saved-configs  
    const treeItems: any[] = [  
      // Update configurationService.ts  
      {    
        path: configPath,    
        mode: '100644' as const,    
        type: 'blob' as const,    
        sha: newBlob.sha    
      }  
    ];  
      
    // Add deletion entries for all saved-configs files  
    const savedConfigsFiles = baseTree.tree.filter(item =>   
      item.path?.startsWith('saved-configs/')  
    );  
      
    savedConfigsFiles.forEach(item => {  
      treeItems.push({  
        path: item.path,  
        mode: '100644' as const,  
        type: 'blob' as const,  
        sha: null  // Setting sha to null deletes the file  
      });  
    });  
      
    const { data: newTree } = await octokit.git.createTree({    
      owner,    
      repo,    
      base_tree: baseTree.sha,  // Keep base_tree  
      tree: treeItems  
    });
    
    // // 5. Get the tree of the default branch    
    // const { data: baseTree } = await octokit.git.getTree({    
    //   owner,    
    //   repo,    
    //   tree_sha: mainBranch.object.sha,    
    //   recursive: 'true'    
    // });    
    
    // // 6. Create a new blob with the updated file content    
    // const { data: newBlob } = await octokit.git.createBlob({    
    //   owner,    
    //   repo,    
    //   content: Buffer.from(content).toString('base64'),    
    //   encoding: 'base64'    
    // });    
    
    // // 7. Create a new tree with the updated file    
    // const { data: newTree } = await octokit.git.createTree({    
    //   owner,    
    //   repo,    
    //   base_tree: baseTree.sha,    
    //   tree: [    
    //     {    
    //       path: configPath,    
    //       mode: '100644',    
    //       type: 'blob',    
    //       sha: newBlob.sha    
    //     }    
    //   ]    
    // });    
    
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
    
    // 10. Trigger Vercel deployment    
    const vercelResponse = await fetch('https://api.vercel.com/v13/deployments?skipAutoDetectionConfirmation=1', {    
      method: 'POST',    
      headers: {    
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,    
        'Content-Type': 'application/json'    
      },    
      body: JSON.stringify({    
        name: process.env.VERCEL_PROJECT_NAME,    
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
        
    // 11. Poll for deployment completion    
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
        const baseUrl = statusData.url     
          ? `https://${statusData.url}`     
          : statusData.alias?.[0]    
            ? `https://${statusData.alias[0]}`    
            : null;    
            
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

// import { NextRequest, NextResponse } from 'next/server';  
// import { Octokit } from '@octokit/rest';  
// import { loadConfigurationFromGitHub } from '../../../services/githubApi';  
// import { DEFAULT_CONFIG } from '../../../services/configurationService';  
  
// export async function POST(request: NextRequest) {  
//   try {  
//     const { configuration, branchName, githubFilename } = await request.json();  
      
//     let finalConfiguration;  
  
//     if (githubFilename) {  
//       console.log('Loading configuration from GitHub:', githubFilename);  
//       try {  
//         const configData = await loadConfigurationFromGitHub(githubFilename);  
          
//         // Merge with defaults to ensure all required fields exist  
//         finalConfiguration = {  
//           standardMenus: (configData.standardMenus as any) || DEFAULT_CONFIG.standardMenus,  
//           customMenus: (configData.customMenus as any) || DEFAULT_CONFIG.customMenus,  
//           menuOrder: (configData.menuOrder as any) || DEFAULT_CONFIG.menuOrder,  
//           homePageConfig: (configData.homePageConfig as any) || DEFAULT_CONFIG.homePageConfig,  
//           appConfig: (configData.appConfig as any) || DEFAULT_CONFIG.appConfig,  
//           fullAppConfig: (configData.fullAppConfig as any) || DEFAULT_CONFIG.fullAppConfig,  
//           stylingConfig: (configData.stylingConfig as any) || DEFAULT_CONFIG.stylingConfig,  
//           userConfig: (configData.userConfig as any) || DEFAULT_CONFIG.userConfig,  
//         };  
//       } catch (error) {  
//         console.error('Failed to load configuration from GitHub:', error);  
//         throw new Error(`Failed to load configuration from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);  
//       }  
//     } else {  
//       // Use configuration from request body (existing behavior)  
//       finalConfiguration = configuration;  
//     }  
      
//     const octokit = new Octokit({  
//       auth: process.env.GITHUB_TOKEN  
//     });  
  
//     const owner = process.env.GITHUB_OWNER!;  
//     const repo = process.env.GITHUB_REPO!;  
  
//     // 1. Get repository info to find default branch AND repo ID  
//     const { data: repoInfo } = await octokit.repos.get({  
//       owner,  
//       repo  
//     });  
      
//     const repoId = repoInfo.id;  
//     const defaultBranch = repoInfo.default_branch;  
      
//     // 2. Get the default branch reference  
//     const { data: mainBranch } = await octokit.git.getRef({  
//       owner,  
//       repo,  
//       ref: `heads/${defaultBranch}`  
//     });  
  
//     // 3. Get the current configurationService.ts content from default branch  
//     const configPath = 'src/services/configurationService.ts';  
//     const { data: fileData } = await octokit.repos.getContent({  
//       owner,  
//       repo,  
//       path: configPath,  
//       ref: defaultBranch  
//     });  
  
//     if (!('content' in fileData)) {  
//       throw new Error('Could not retrieve file content');  
//     }  
    
    
//     // 4. Prepare the updated content  
//     let content = Buffer.from(fileData.content, 'base64').toString();
//     if (!finalConfiguration) {  
//       throw new Error('Configuration is undefined - cannot proceed with deployment');  
//     }
//     const configString = JSON.stringify(finalConfiguration, null, 2);  
//     content = content.replace(  
//       /export const DEFAULT_CONFIG: ConfigurationData = (?:\{[\s\S]*?\}|undefined);/,  
//       `export const DEFAULT_CONFIG: ConfigurationData = ${configString};`  
//     );
//     // After the replace, verify it worked
//     if (content.includes('= undefined;')) {
//       throw new Error('Failed to replace DEFAULT_CONFIG - pattern did not match');
//     }
  
//     // 5. Get the tree of the default branch  
//     const { data: baseTree } = await octokit.git.getTree({  
//       owner,  
//       repo,  
//       tree_sha: mainBranch.object.sha,  
//       recursive: 'true'  
//     });  
  
//     // 6. Create a new blob with the updated file content  
//     const { data: newBlob } = await octokit.git.createBlob({  
//       owner,  
//       repo,  
//       content: Buffer.from(content).toString('base64'),  
//       encoding: 'base64'  
//     });  
  
//     // 7. Create a new tree with the updated file  
//     const { data: newTree } = await octokit.git.createTree({  
//       owner,  
//       repo,  
//       base_tree: baseTree.sha,  
//       tree: [  
//         {  
//           path: configPath,  
//           mode: '100644',  
//           type: 'blob',  
//           sha: newBlob.sha  
//         }  
//       ]  
//     });  
  
//     // 8. Create a commit with the new tree  
//     const { data: newCommit } = await octokit.git.createCommit({  
//       owner,  
//       repo,  
//       message: `Bake configuration for deployment: ${branchName}`,  
//       tree: newTree.sha,  
//       parents: [mainBranch.object.sha]  
//     });  
  
//     // 9. Create the new branch pointing to the new commit  
//     await octokit.git.createRef({  
//       owner,  
//       repo,  
//       ref: `refs/heads/${branchName}`,  
//       sha: newCommit.sha  
//     });  
  
//     // 10. Trigger Vercel deployment  
//     const vercelResponse = await fetch('https://api.vercel.com/v13/deployments', {  
//       method: 'POST',  
//       headers: {  
//         'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,  
//         'Content-Type': 'application/json'  
//       },  
//       body: JSON.stringify({  
//         name: process.env.VERCEL_PROJECT_ID,  
//         gitSource: {  
//           type: 'github',  
//           repo: `${owner}/${repo}`,  
//           ref: branchName,  
//           repoId: repoId  
//         },  
//       })  
//     });  
      
//     if (!vercelResponse.ok) {  
//       const errorData = await vercelResponse.json();  
//       console.error('Vercel deployment failed:', errorData);  
//       throw new Error(`Vercel deployment failed: ${errorData.error?.message || 'Unknown error'}`);  
//     }  
      
//     const deployment = await vercelResponse.json();  
//     console.log('Vercel deployment response:', deployment);  
      
//     // 11. Poll for deployment completion  
//     let deploymentUrl = null;  
//     const maxAttempts = 60;  
//     let attempts = 0;  
      
//     while (attempts < maxAttempts) {  
//       const statusResponse = await fetch(  
//         `https://api.vercel.com/v13/deployments/${deployment.id}`,  
//         {  
//           headers: {  
//             'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`  
//           }  
//         }  
//       );  
        
//       const statusData = await statusResponse.json();  
        
//       if (statusData.readyState === 'READY') {  
//         const baseUrl = statusData.url   
//           ? `https://${statusData.url}`   
//           : statusData.alias?.[0]  
//             ? `https://${statusData.alias[0]}`  
//             : null;  
          
//         if (baseUrl) {  
//           try {  
//             const shareResponse = await fetch(  
//               `https://api.vercel.com/v1/deployments/${deployment.id}/share`,  
//               {  
//                 method: 'POST',  
//                 headers: {  
//                   'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`  
//                 }  
//               }  
//             );  
              
//             if (shareResponse.ok) {  
//               const shareData = await shareResponse.json();  
//               deploymentUrl = `${baseUrl}?_vercel_share=${shareData.token}`;  
//             } else {  
//               deploymentUrl = baseUrl;  
//             }  
//           } catch (error) {  
//             console.error('Failed to create share link:', error);  
//             deploymentUrl = baseUrl;  
//           }  
//         }  
//         break;  
//       } else if (statusData.readyState === 'ERROR' || statusData.readyState === 'CANCELED') {  
//         throw new Error(`Deployment failed with state: ${statusData.readyState}`);  
//       }  
        
//       await new Promise(resolve => setTimeout(resolve, 5000));  
//       attempts++;  
//     }  
      
//     return NextResponse.json({  
//       success: true,  
//       branchUrl: `https://github.com/${owner}/${repo}/tree/${branchName}`,  
//       deploymentUrl,  
//       deploymentId: deployment.id  
//     });  
  
//   } catch (error) {  
//     console.error('Publish deployment error:', error);  
//     return NextResponse.json({  
//       success: false,  
//       error: error instanceof Error ? error.message : 'Unknown error'  
//     }, { status: 500 });  
//   }  
// }