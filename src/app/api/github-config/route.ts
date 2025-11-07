import { NextRequest, NextResponse } from 'next/server';  
 
export async function GET(request: NextRequest) {  
  try {  
    const searchParams = request.nextUrl.searchParams;  
    const filename = searchParams.get('filename');  
 
    if (!filename) {  
      return NextResponse.json(  
        { error: "Filename is required" },  
        { status: 400 }  
      );  
    }  
 
    const repoOwner = "Aparnaa-Marimuthu";  
    const repoName = "tse-configuration";  
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
    return NextResponse.json(fileData);  
  } catch (error) {  
    console.error("Error loading configuration:", error);  
    return NextResponse.json(  
      { error: error instanceof Error ? error.message : "Unknown error" },  
      { status: 500 }  
    );  
  }  
}
 