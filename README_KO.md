# VisualizationReactTree

[English](README_EN.md) | [한국어](README_KO.md)

**VisualizationReactTree**는 사용자의 React 프로젝트의 컴포넌트 트리를 파싱하여, 인터랙티브한 다이어그램 형태로 시각화하는 React 애플리케이션입니다.  
이 프로젝트는 FigJam과 유사한 사용자 경험을 제공하며, 노드 드래그, 멀티 선택, 줌 인/아웃 등의 기능을 지원합니다.

---

## 주요 기능

1. **폴더 선택 및 업로드**

   - 사용자는 "폴더 선택" 버튼을 클릭하여 자신의 React 프로젝트의 루트 디렉토리를 업로드합니다.
   - 업로드된 파일 목록은 IPC(Inter-Process Communication)를 통해 Electron API를 사용하여 읽어들입니다.

2. **컴포넌트 트리 파싱**

   - 업로드된 프로젝트의 파일들을 Babel 또는 TypeScript API를 활용하여 파싱합니다.
   - 각 파일(예: .jsx, .tsx)에서 컴포넌트를 추출하고, 부모-자식 관계(컴포넌트 트리)를 구성합니다.
   - 파싱 결과는 JSON 형태의 트리 구조로 변환됩니다.

3. **인터랙티브 다이어그램 시각화**
   - 파싱된 컴포넌트 트리 데이터를 기반으로 ReactFlow 라이브러리를 사용하여 다이어그램 형태로 렌더링합니다.
   - 각 노드는 카드 형태로 디자인되어 있으며, 드래그, 멀티 선택, 줌인/줌아웃 등의 인터랙션을 지원합니다.
   - 노드 간 연결(에지)는 애니메이션 효과와 함께 표시되어, 컴포넌트 간의 관계를 한눈에 파악할 수 있습니다.
   - 루트 노드가 화면 상단 중앙에 위치하도록 중앙 정렬 처리가 되어 있습니다.

## 설치 및 실행

### 요구 사항

- Node.js (최소 버전 14 이상)
- npm 또는 yarn
- Electron (프로젝트에서 IPC를 통해 폴더 선택 기능 사용)

### 설치 방법

1. **저장소 클론**

   ```bash
   git clone https://github.com/your-username/VisualizationReactTree.git
   cd VisualizationReactTree
   ```

2. **의존성 설치**

   ```bash
   npm install
   ```

3. **애플리케이션 실행**
   ```bash
   npm run start
   ```

## 사용 방법

1. 폴더 선택

   - 애플리케이션 상단의 "폴더 선택" 버튼을 클릭합니다.
   - Electron API를 통해 로컬 파일 시스템에서 React 프로젝트의 루트 디렉토리를 선택합니다.

2. 컴포넌트 트리 파싱 및 시각화

   - 선택된 폴더의 파일 목록이 읽혀지고, Babel 또는 TypeScript API를 통해 각 컴포넌트와 그 관계가 파싱됩니다.
   - 파싱된 데이터를 기반으로 구성된 컴포넌트 트리가 ReactFlow를 사용하여 다이어그램으로 렌더링됩니다.
   - 다이어그램 내의 각 노드는 드래그할 수 있으며, 멀티 선택 및 줌 기능이 활성화되어 FigJam과 유사한 인터랙션을 제공합니다.

   3. 상세 탐색

   - 왼쪽의 폴더 트리 네비게이션을 통해 특정 노드를 선택하면, 해당 노드를 루트로 하는 서브트리가 다이어그램에 표시됩니다.

## 커스터마이징 및 확장

- 노드 디자인
  - 각 노드의 스타일은 ComponentFlow 컴포넌트 내부의 인라인 스타일 객체에서 수정할 수 있습니다.
  - 폰트, 배경색, 테두리, 그림자 등을 변경하여 자신만의 디자인을 적용할 수 있습니다.
- 레이아웃 조정
  - 기본적으로 horizontal layout(세로 깊이)이 적용되어 있으나, 필요에 따라 vertical layout(가로 깊이)로 전환하거나 커스터마이징할 수 있습니다.
  - 중앙 정렬 오프셋 및 x, y spacing 값을 조정하여 레이아웃의 간격을 세밀하게 조정할 수 있습니다.
- 파일 파싱 로직

  - 프로젝트의 파일 파싱 로직은 src/utils/parseProject.ts에 구현되어 있습니다.
  - Babel이나 TypeScript API를 활용한 파싱 방식을 수정하여, 다양한 파일 형식을 지원할 수 있도록 확장할 수 있습니다.

  ## 컴포넌트 트리 파싱 프로세스

### 1. 파일 시스템 탐색

- `readFolderRecursive` 함수를 통해 프로젝트의 모든 파일을 재귀적으로 탐색합니다.
- node_modules, dist 등 불필요한 디렉토리는 제외됩니다.
- .jsx, .tsx, .js, .ts 확장자를 가진 파일들만 선별합니다.

### 2. AST(Abstract Syntax Tree) 파싱

- @babel/parser를 사용하여 각 파일의 코드를 AST로 변환합니다.
- 파싱 설정:
  ```javascript
  parse(content, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });
  ```

### 3. 컴포넌트 추출 프로세스

1. **임포트 분석**

   - @babel/traverse를 사용하여 모든 import 구문을 분석
   - 각 임포트된 컴포넌트의 로컬 이름과 실제 모듈 경로를 매핑

   ```javascript
   ImportDeclaration: {
     // 예: import Button from './Button'
     // → { Button: './Button' }로 매핑
   }
   ```

2. **컴포넌트 선언 탐지**

   - 다음 순서로 컴포넌트를 탐지:
     1. Default Export 검사
        - 함수 선언 (FunctionDeclaration)
        - 화살표 함수 (ArrowFunctionExpression)
        - 클래스 선언 (ClassDeclaration)
     2. Named Export 검사
     3. 대문자로 시작하는 함수 선언 검사

3. **컴포넌트 관계 분석**
   - JSX 요소 내에서 사용된 컴포넌트 참조 추적
   - 대문자로 시작하는 JSX 태그를 탐지
   - import된 컴포넌트와 매칭하여 부모-자식 관계 구성

### 4. 트리 구조 생성

1. **임시 컴포넌트 맵 생성**

   ```typescript
   interface TempComponent {
     id: string; // 파일 경로
     name: string; // 컴포넌트 이름
     filePath: string; // 파일 경로
     childrenRefs: {
       // 자식 컴포넌트 참조
       localName: string; // 로컬에서 사용된 이름
       importedPath: string; // 실제 임포트 경로
     }[];
   }
   ```

2. **경로 해결 및 관계 구성**

   - 상대 경로를 절대 경로로 변환
   - 파일 확장자 처리 (.jsx, .tsx, .js, .ts)
   - 순환 참조 방지

3. **최종 트리 구조 생성**
   ```typescript
   interface ParsedComponent {
     id: string;
     name: string;
     filePath: string;
     children: ParsedComponent[];
   }
   ```

### 5. 루트 컴포넌트 식별

- 다른 컴포넌트에 의해 임포트되지 않은 컴포넌트를 루트로 식별
- 여러 개의 루트 컴포넌트가 존재할 수 있음 (예: 페이지 컴포넌트들)

### 6. Route 기반 컴포넌트 트리 구성

1. **라우트 컴포넌트 식별**

   - React Router의 Route 컴포넌트 검출

   ```javascript
   JSXElement(path) {
     if (path.node.openingElement.name.name === 'Route') {
       // Route 컴포넌트 처리
     }
   }
   ```

2. **Path 기반 계층 구조 분석**

   - URL 패턴을 기반으로 라우트 간의 계층 관계 구성

   ```javascript
   // 예시 라우트 구조
   {
     '/': 'RootLayout',
     '/dashboard': 'DashboardPage',
     '/dashboard/users': 'UsersPage',
     '/dashboard/settings': 'SettingsPage'
   }
   ```

3. **중첩 라우트 처리**

   - 부모 라우트와 자식 라우트 관계 매핑
   - Outlet 컴포넌트 위치 확인

   ```typescript
   interface RouteComponent extends ParsedComponent {
     path: string;
     parentPath?: string;
     outlet?: boolean;
   }
   ```

4. **라우트 트리 병합**
   - 일반 컴포넌트 트리와 라우트 기반 트리 통합
   - 중복 참조 처리 및 순환 참조 방지
   ```javascript
   // 예시 출력 구조
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

### 예시 출력

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
        // 중첩된 자식 컴포넌트들...
      ]
    }
  ]
}
```

## 기여하기

1. 이슈 제출
   - 버그 리포트, 기능 요청, 개선 사항 등은 GitHub 이슈 트래커에 제출해주세요.
2. 풀 리퀘스트
   - 새로운 기능 추가 또는 버그 수정을 위한 코드를 작성한 후, 풀 리퀘스트(PR)를 통해 기여할 수 있습니다.
   - 코드 리뷰 후 머지될 예정입니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
