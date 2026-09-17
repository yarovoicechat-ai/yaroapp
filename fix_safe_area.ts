import * as fs from "fs";
import * as path from "path";

const SRC_DIR = path.join(process.cwd(), "src");

const VALID_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];

const SAFE_IMPORT =
  "import { SafeAreaView } from 'react-native-safe-area-context';";

function walk(dir: string): string[] {
  let results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (VALID_EXTENSIONS.includes(path.extname(fullPath))) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function fixFile(file: string): boolean {
  let content = fs.readFileSync(file, "utf8");

  if (!content.includes("SafeAreaView")) {
    return false;
  }

  const rnImportRegex =
    /import\s*\{([\s\S]*?)\}\s*from\s*['"]react-native['"]\s*;?/m;

  const match = content.match(rnImportRegex);

  if (!match) {
    return false;
  }

  const imports = match[1]
    .split(",")
    .map((x) => x.replace(/\n/g, "").trim())
    .filter(Boolean);

  if (!imports.includes("SafeAreaView")) {
    return false;
  }

  const filteredImports = imports.filter(
    (item) => item !== "SafeAreaView"
  );

  let replacement = "";

  if (filteredImports.length > 0) {
    replacement =
      `import { ${filteredImports.join(", ")} } from 'react-native';`;
  }

  const alreadyHasSafeImport =
    /from\s+['"]react-native-safe-area-context['"]/.test(content);

  if (!alreadyHasSafeImport) {
    replacement +=
      (replacement ? "\n" : "") +
      SAFE_IMPORT;
  }

  const newContent = content.replace(
    rnImportRegex,
    replacement
  );

  if (newContent === content) {
    return false;
  }

  fs.writeFileSync(file + ".bak", content);

  fs.writeFileSync(file, newContent);

  return true;
}

const files = walk(SRC_DIR);

let fixed = 0;

for (const file of files) {
  try {
    if (fixFile(file)) {
      console.log("✔", path.relative(SRC_DIR, file));
      fixed++;
    }
  } catch (err) {
      console.error("❌", file, err);
  }
}

console.log("");
console.log("====================================");
console.log("Total files fixed:", fixed);
console.log("====================================");