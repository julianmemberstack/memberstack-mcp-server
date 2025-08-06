#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Documentation categories
const DOC_CATEGORIES = {
  "dom-api": "DOM Package API Reference",
  "admin-api": "Admin Package API Reference", 
  "rest-api": "REST API Reference",
  "authentication": "Authentication Flows",
  "quick-start": "Quick Start Guide",
  "error-handling": "Error Handling Guide",
  "integration-patterns": "Integration Patterns",
  "decision-trees": "Method Decision Trees"
};

class MemberstackMCPServer {
  private server: Server;
  private docsPath: string;

  constructor() {
    this.server = new Server(
      {
        name: "memberstack-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Docs are bundled with the package
    this.docsPath = path.join(__dirname, "..", "docs");
    
    this.setupHandlers();
  }

  private async getDocumentationFiles(): Promise<Array<{ path: string; category: string; title: string }>> {
    const files: Array<{ path: string; category: string; title: string }> = [];
    
    try {
      const docFiles = await glob("**/*.md", { cwd: this.docsPath });
      
      for (const file of docFiles) {
        const content = await fs.readFile(path.join(this.docsPath, file), "utf-8");
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : path.basename(file, ".md");
        
        // Determine category from file path
        const category = this.getCategoryFromPath(file);
        
        files.push({
          path: file,
          category,
          title
        });
      }
    } catch (error) {
      console.error("Error reading documentation files:", error);
    }
    
    return files;
  }

  private getCategoryFromPath(filePath: string): string {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath, ".md");
    
    // Map file paths to categories
    if (filePath.includes("dom-package")) return "dom-api";
    if (filePath.includes("admin-package")) return "admin-api";
    if (filePath.includes("rest-api")) return "rest-api";
    if (basename === "authentication-flows") return "authentication";
    if (basename === "quick-start") return "quick-start";
    if (basename === "error-handling-guide") return "error-handling";
    if (filePath.includes("integration-patterns")) return "integration-patterns";
    if (filePath.includes("decision-trees")) return "decision-trees";
    
    return "general";
  }

  private setupHandlers() {
    // List available resources (documentation files)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const files = await this.getDocumentationFiles();
      
      return {
        resources: files.map(file => ({
          uri: `memberstack://${file.path}`,
          name: file.title,
          description: `${DOC_CATEGORIES[file.category] || file.category} - ${file.title}`,
          mimeType: "text/markdown",
        })),
      };
    });

    // Read specific documentation file
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const filePath = uri.replace("memberstack://", "");
      
      try {
        const fullPath = path.join(this.docsPath, filePath);
        const content = await fs.readFile(fullPath, "utf-8");
        
        return {
          contents: [
            {
              uri,
              mimeType: "text/markdown",
              text: content,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Could not read documentation file: ${filePath}`);
      }
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_memberstack_docs",
            description: "Search through Memberstack documentation for specific topics, methods, or examples",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query (e.g., 'authentication', 'updateProfile', 'React examples')",
                },
                category: {
                  type: "string",
                  description: "Optional: Filter by category (dom-api, admin-api, rest-api, etc.)",
                  enum: Object.keys(DOC_CATEGORIES),
                },
              },
              required: ["query"],
            },
          },
          {
            name: "list_memberstack_methods",
            description: "List all available Memberstack methods by category",
            inputSchema: {
              type: "object",
              properties: {
                package: {
                  type: "string",
                  description: "Package to list methods for",
                  enum: ["dom", "admin", "rest"],
                },
              },
              required: ["package"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === "search_memberstack_docs") {
        return await this.searchDocumentation(args.query, args.category);
      }

      if (name === "list_memberstack_methods") {
        return await this.listMethods(args.package);
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  private async searchDocumentation(query: string, category?: string) {
    const files = await this.getDocumentationFiles();
    const results: Array<{ file: string; title: string; matches: string[] }> = [];
    
    for (const file of files) {
      // Filter by category if specified
      if (category && file.category !== category) continue;
      
      const content = await fs.readFile(path.join(this.docsPath, file.path), "utf-8");
      const lines = content.split("\n");
      const matches: string[] = [];
      
      const queryLower = query.toLowerCase();
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(queryLower)) {
          // Include context (previous and next line)
          const context = [
            lines[index - 1] || "",
            line,
            lines[index + 1] || "",
          ].filter(Boolean).join("\n");
          
          matches.push(context);
        }
      });
      
      if (matches.length > 0) {
        results.push({
          file: file.path,
          title: file.title,
          matches: matches.slice(0, 5), // Limit to 5 matches per file
        });
      }
    }
    
    return {
      content: [
        {
          type: "text",
          text: results.length > 0
            ? `Found ${results.length} files with matches:\n\n${results
                .map(r => `### ${r.title} (${r.file})\n${r.matches.join("\n---\n")}`)
                .join("\n\n")}`
            : `No matches found for "${query}"`,
        },
      ],
    };
  }

  private async listMethods(packageName: string) {
    const methodMappings = {
      dom: "dom-package/dom-api-reference.md",
      admin: "admin-package/admin-api-reference.md",
      rest: "rest-api/rest-api-reference.md",
    };
    
    const filePath = methodMappings[packageName];
    if (!filePath) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown package: ${packageName}. Available packages: dom, admin, rest`,
          },
        ],
      };
    }
    
    try {
      const content = await fs.readFile(path.join(this.docsPath, filePath), "utf-8");
      
      // Extract method signatures
      const methodRegex = /^###\s+`(.+)`/gm;
      const methods: string[] = [];
      let match;
      
      while ((match = methodRegex.exec(content)) !== null) {
        methods.push(match[1]);
      }
      
      return {
        content: [
          {
            type: "text",
            text: `## ${packageName.toUpperCase()} Package Methods\n\n${methods.join("\n")}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading ${packageName} documentation`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Memberstack MCP server running...");
  }
}

const server = new MemberstackMCPServer();
server.run().catch(console.error);