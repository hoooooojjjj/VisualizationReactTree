# VisualizationReactTree

[English](README_EN.md) | [한국어](README_KO.md)

**VisualizationReactTree** is a React application that parses the component tree of your React project and visualizes it in an interactive diagram format.  
This project provides a user experience similar to FigJam and supports features such as node dragging, multi-selection, and zoom in/out.

---

## Key Features

1. **Folder Selection and Upload**

   - Users can click the "Select Folder" button to upload the root directory of their React project.
   - The uploaded file list is read using the Electron API through IPC (Inter-Process Communication).

2. **Component Tree Parsing**

   - Parse the files of the uploaded project using Babel or TypeScript API.
   - Extract components from each file (e.g., .jsx, .tsx) and construct parent-child relationships (component tree).
   - Parsing results are converted into a JSON tree structure.

3. **Interactive Diagram Visualization**
   - Render the parsed component tree data as a diagram using the ReactFlow library.
   - Each node is designed in card form and supports interactions such as dragging, multi-selection, and zoom in/out.
   - Connections (edges) between nodes are displayed with animation effects, making component relationships easily visible at a glance.
   - The root node is centered at the top of the screen.

## Component Tree Parsing Process

### 1. File System Exploration

- Recursively explore all files in the project through the `readFolderRecursive` function.
- Exclude unnecessary directories such as node_modules, dist, etc.
- Select only files with .jsx, .tsx, .js, .ts extensions.

### 2. AST(Abstract Syntax Tree) Parsing

- Convert code from each file to AST using @babel/parser.
- Parsing configuration:
  ```javascript
  parse(content, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });
  ```

## Installation and Execution

### Requirements

- Node.js (minimum version 14 or higher)
- npm or yarn
- Electron (used for folder selection functionality through IPC in the project)

### Installation Steps

1. **Clone Repository**

   ```bash
   git clone https://github.com/your-username/VisualizationReactTree.git
   cd VisualizationReactTree
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Run Application**
   ```bash
   npm run start
   ```

## How to Use

1. Folder Selection

   - Click the "Select Folder" button at the top of the application.
   - Select the root directory of your React from the local file system through the Electron API.

2. Component Tree Parsing and Visualization

   - The file list from the selected folder is read, and each component and its relationships are parsed through Babel or TypeScript API.
   - The component tree constructed from the parsed data is rendered as a diagram using ReactFlow.
   - Each node in the diagram can be dragged, and multi-selection and zoom functionality are enabled, providing FigJam-like interactions.

3. Detailed Navigation

   - Select specific nodes through the folder tree navigation on the left to display the subtree rooted at that node in the diagram.

## Customization and Extension

- Node Design
  - Each node's style can be modified in the inline style object within the ComponentFlow component.
  - You can apply your own design by changing fonts, background colors, borders, shadows, etc.
- Layout Adjustment
  - By default, a horizontal layout (vertical depth) is applied, but you can switch to a vertical layout (horizontal depth) or customize as needed.
  - Fine-tune the layout spacing by adjusting center alignment offset and x, y spacing values.
- File Parsing Logic

  - The project's file parsing logic is implemented in src/utils/parseProject.ts.
  - Modify the parsing method using Babel or TypeScript API to extend support for various file formats.

  ### 3. Component Extraction Process

1. **Import Analysis**

   - Analyze all import statements using @babel/traverse
   - Map local names and actual module paths of each imported component

   ```javascript
   ImportDeclaration: {
     // Example: import Button from './Button'
     // → Mapped as { Button: './Button' }
   }
   ```

2. **Component Declaration Detection**

   - Detect components in the following order:
     1. Default Export Check
        - Function Declaration
        - Arrow Function Expression
        - Class Declaration
     2. Named Export Check
     3. Check for function declarations starting with uppercase

3. **Component Relationship Analysis**
   - Track component references used within JSX elements
   - Detect JSX tags starting with uppercase
   - Construct parent-child relationships by matching with imported components

### 4. Tree Structure Generation

1. **Create Temporary Component Map**

   ```typescript
   interface TempComponent {
     id: string; // file path
     name: string; // component name
     filePath: string; // file path
     childrenRefs: {
       // child component references
       localName: string; // locally used name
       importedPath: string; // actual import path
     }[];
   }
   ```

2. **Path Resolution and Relationship Construction**

   - Convert relative paths to absolute paths
   - Handle file extensions (.jsx, .tsx, .js, .ts)
   - Prevent circular references

3. **Generate Final Tree Structure**
   ```typescript
   interface ParsedComponent {
     id: string;
     name: string;
     filePath: string;
     children: ParsedComponent[];
   }
   ```

### 5. Root Component Identification

- Identify components not imported by other components as roots
- Multiple root components may exist (e.g., page components)

### 6. Route-based Component Tree Construction

1. **Route Component Identification**

   - Detect React Router's Route components

   ```javascript
   JSXElement(path) {
     if (path.node.openingElement.name.name === 'Route') {
       // Handle Route component
     }
   }
   ```

2. **Path-based Hierarchy Analysis**

   - Construct hierarchical relationships between routes based on URL patterns

   ```javascript
   // Example route structure
   {
     '/': 'RootLayout',
     '/dashboard': 'DashboardPage',
     '/dashboard/users': 'UsersPage',
     '/dashboard/settings': 'SettingsPage'
   }
   ```

3. **Nested Route Handling**

   - Map parent route and child route relationships
   - Check Outlet component locations

   ```typescript
   interface RouteComponent extends ParsedComponent {
     path: string;
     parentPath?: string;
     outlet?: boolean;
   }
   ```

4. **Route Tree Merging**
   - Integrate general component tree with route-based tree
   - Handle duplicate references and prevent circular references
   ```javascript
   // Example output structure
   {
     id: "/src/App.tsx",
     name: "RootLayout",
     path: "/",
     children: [
       {
         id: "/src/pages/Dashboard.tsx",
         name: "DashboardPage",
         path: "/dashboard",
         children: [
           {
             id: "/src/pages/Users.tsx",
             name: "UsersPage",
             path: "/dashboard/users",
             children: []
           }
         ]
       }
     ]
   }
   ```

### Example Output

```javascript
{
  id: "/src/App.tsx",
  name: "App",
  filePath: "/src/App.tsx",
  children: [
    {
      id: "/src/components/Header.tsx",
      name: "Header",
      filePath: "/src/components/Header.tsx",
      children: []
    },
    {
      id: "/src/components/MainContent.tsx",
      name: "MainContent",
      filePath: "/src/components/MainContent.tsx",
      children: [
        // Nested child components...
      ]
    }
  ]
}
```

## Contributing

1. Submit Issues
   - Submit bug reports, feature requests, and improvements to the GitHub issue tracker.
2. Pull Requests
   - You can contribute by writing code for new features or bug fixes through pull requests (PRs).
   - Code will be merged after review.

## License

This project is distributed under the MIT License.
