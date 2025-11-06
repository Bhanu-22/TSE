interface GitHubConfig {  
  name: string;  
  description?: string;  
  config: Record<string, unknown>;  
  filename: string;  
}  
 
interface GitHubApiResponse {  
  name: string;  
  path: string;  
  sha: string;  
  size: number;  
  url: string;  
  html_url: string;  
  git_url: string;  
  download_url: string;  
  type: string;  
  content?: string;  
  encoding?: string;  
  _links: {  
    self: string;  
    git: string;  
    html: string;  
  };  
}  
 
export async function fetchSavedConfigurations(): Promise<GitHubConfig[]> {  
  try {  
    console.log("Fetching saved configurations from GitHub...");  
     
    const response = await fetch('/api/github-configs');  
 
    if (!response.ok) {  
      throw new Error(`Failed to fetch configurations: ${response.statusText}`);  
    }  
 
    const contents: GitHubApiResponse[] = await response.json();  
    console.log("GitHub directory contents:", contents);  
 
    const jsonFiles = contents.filter(  
      (item) => item.type === "file" && item.name.endsWith(".json")  
    );  
    console.log("JSON files found:", jsonFiles);  
 
    const configs: GitHubConfig[] = [];  
 
    for (const file of jsonFiles) {  
      try {  
        console.log("Fetching config file:", file.name);  
         
        const configResponse = await fetch(  
          `/api/github-config?filename=${encodeURIComponent(file.name)}`  
        );  
         
        if (configResponse.ok) {  
          const fileData = await configResponse.json();  
           
          const base64Content = fileData.content.replace(/\n/g, '');  
          const decodedContent = atob(base64Content);  
          const fileConfigData = JSON.parse(decodedContent);  
 
          const name = file.name.replace(".json", "");  
          configs.push({  
            name,  
            description: fileConfigData.description || `Configuration: ${name}`,  
            config: fileConfigData,  
            filename: file.name,  
          });  
          console.log("Successfully loaded config:", name);  
        }  
      } catch (error) {  
        console.error(`Failed to fetch config ${file.name}:`, error);  
      }  
    }  
 
    console.log("Total configurations loaded:", configs.length);  
    return configs;  
  } catch (error) {  
    console.error("Error fetching saved configurations:", error);  
    throw error;  
  }  
}  
 
export async function loadConfigurationFromGitHub(  
  filename: string  
): Promise<Record<string, unknown>> {  
  try {  
    console.log("Loading configuration from GitHub:", filename);  
 
    const response = await fetch(  
      `/api/github-config?filename=${encodeURIComponent(filename)}`  
    );  
 
    if (!response.ok) {  
      console.error(`API error: ${response.status} ${response.statusText}`);  
      if (response.status === 403) {  
        throw new Error(`GitHub API rate limit exceeded. Please try again later.`);  
      } else if (response.status === 404) {  
        throw new Error(`Configuration file '${filename}' not found.`);  
      } else {  
        throw new Error(`Failed to fetch configuration: ${response.status} ${response.statusText}`);  
      }  
    }  
 
    const fileData: GitHubApiResponse = await response.json();  
    console.log("GitHub file data:", fileData);  
 
    if (!fileData.content) {  
      throw new Error("No content found in GitHub response");  
    }  
 
    const base64Content = fileData.content.replace(/\n/g, '');  
    const decodedContent = atob(base64Content);  
     
    let configData;  
    try {  
      configData = JSON.parse(decodedContent);  
    } catch (parseError) {  
      console.error("Failed to parse GitHub response as JSON:", parseError);  
      throw new Error("Invalid JSON in GitHub configuration file");  
    }  
 
    console.log("Loaded config data from GitHub:", configData);  
    return configData;  
  } catch (error) {  
    console.error("Error loading configuration from GitHub:", error);  
 
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {  
      throw new Error("Network error: Unable to connect to server. Please check your connection.");  
    } else if (error instanceof Error) {  
      throw error;  
    } else {  
      throw new Error("Unknown error occurred while loading configuration from GitHub.");  
    }  
  }  
}
 