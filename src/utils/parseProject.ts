import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

export interface ParsedComponent {
  id: string;
  name: string;
  filePath: string;
  children: ParsedComponent[];
}

// 내부 처리용 임시 인터페이스
interface TempComponent {
  id: string;
  name: string;
  filePath: string;
  childrenRefs: { localName: string; importedPath: string }[];
}

export function parseProject(filePaths: string[]): ParsedComponent[] {
  // Vite 프로젝트의 경우 src 폴더 안의 파일만 대상으로 합니다.
  const filteredPaths = filePaths.filter((file) =>
    file.includes(`${path.sep}src${path.sep}`)
  );

  const tempComponents: TempComponent[] = [];

  filteredPaths.forEach((file) => {
    if (!/\.(jsx|tsx|js|ts)$/.test(file)) return;
    const content = fs.readFileSync(file, "utf-8");
    try {
      const ast = parse(content, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
      });
      let componentName: string | null = null;
      let childrenRefs: { localName: string; importedPath: string }[] = [];
      const importMap: Record<string, string> = {};

      // 1. import 선언 분석: 로컬 이름과 실제 모듈 경로 매핑
      traverse(ast, {
        ImportDeclaration(path: any) {
          const node = path.node;
          const source = node.source.value;
          node.specifiers.forEach((specifier: any) => {
            if (
              specifier.type === "ImportDefaultSpecifier" ||
              specifier.type === "ImportSpecifier"
            ) {
              importMap[specifier.local.name] = source;
            }
          });
        },
      });

      // 2. Export된 컴포넌트 이름 추출 (default export 우선)
      traverse(ast, {
        ExportDefaultDeclaration(path: any) {
          const node = path.node;
          if (node.declaration.type === "Identifier") {
            componentName = node.declaration.name;
          } else if (
            node.declaration.type === "FunctionDeclaration" &&
            node.declaration.id
          ) {
            componentName = node.declaration.id.name;
          } else if (node.declaration.type === "ArrowFunctionExpression") {
            componentName = "AnonymousComponent";
          } else if (
            node.declaration.type === "ClassDeclaration" &&
            node.declaration.id
          ) {
            componentName = node.declaration.id.name;
          }
        },
      });

      // 3. default export가 없으면, 이름 있는 함수 선언(대문자로 시작하는 경우) 찾기
      if (!componentName) {
        traverse(ast, {
          FunctionDeclaration(path: any) {
            if (path.node.id && /^[A-Z]/.test(path.node.id.name)) {
              componentName = path.node.id.name;
              path.stop();
            }
          },
        });
      }

      // 4. JSX 내부에서 사용된 컴포넌트 추출 (대문자 시작 & import 된 것)
      traverse(ast, {
        JSXOpeningElement(path: any) {
          const node = path.node;
          if (node.name && node.name.type === "JSXIdentifier") {
            const tagName = node.name.name;
            if (/^[A-Z]/.test(tagName) && importMap[tagName]) {
              childrenRefs.push({
                localName: tagName,
                importedPath: importMap[tagName],
              });
            }
          }
        },
      });

      if (componentName) {
        tempComponents.push({
          id: file,
          name: componentName,
          filePath: file,
          childrenRefs,
        });
      }
    } catch (error) {
      console.error(`Error parsing ${file}: `, error);
    }
  });

  // 임시 컴포넌트들을 파일 경로 기준으로 매핑
  const resultMap: Record<string, ParsedComponent> = {};
  tempComponents.forEach((comp) => {
    resultMap[comp.filePath] = {
      id: comp.id,
      name: comp.name,
      filePath: comp.filePath,
      children: [],
    };
  });

  // 각 컴포넌트의 childrenRefs를 기준으로 부모-자식 관계 연결
  tempComponents.forEach((comp) => {
    const parent = resultMap[comp.filePath];
    comp.childrenRefs.forEach((ref) => {
      // 부모 파일의 디렉토리를 기준으로 상대경로 해결
      let resolvedPath = path.resolve(
        path.dirname(comp.filePath),
        ref.importedPath
      );
      // 확장자 처리: 파일이 존재하지 않으면 여러 확장자를 시험
      if (!fs.existsSync(resolvedPath)) {
        if (fs.existsSync(resolvedPath + ".jsx")) {
          resolvedPath += ".jsx";
        } else if (fs.existsSync(resolvedPath + ".tsx")) {
          resolvedPath += ".tsx";
        } else if (fs.existsSync(resolvedPath + ".js")) {
          resolvedPath += ".js";
        } else if (fs.existsSync(resolvedPath + ".ts")) {
          resolvedPath += ".ts";
        }
      }
      if (resolvedPath !== comp.filePath && resultMap[resolvedPath]) {
        parent.children.push(resultMap[resolvedPath]);
      }
    });
  });

  // 최상위(root) 컴포넌트 추출: 다른 컴포넌트의 자식으로 참조되지 않은 경우
  const allChildIds = new Set<string>();
  Object.values(resultMap).forEach((comp) => {
    comp.children.forEach((child) => allChildIds.add(child.id));
  });
  const rootComponents = Object.values(resultMap).filter(
    (comp) => !allChildIds.has(comp.id)
  );

  return rootComponents;
}
