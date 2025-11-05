import { NextResponse } from 'next/server';  
  
export async function GET() {  
  try {  
    const repoOwner = "Bhanu-22";  
    const repoName = "TSE";  
    const configsPath = "saved-configs";  
  
    const response = await fetch(  
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${configsPath}`,  
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
      throw new Error(`Failed to fetch configurations: ${response.statusText}`);  
    }  
  
    const contents = await response.json();  
    return NextResponse.json(contents);  
  } catch (error) {  
    console.error("Error fetching configurations:", error);  
    return NextResponse.json(  
      { error: error instanceof Error ? error.message : "Unknown error" },  
      { status: 500 }  
    );  
  }  
}