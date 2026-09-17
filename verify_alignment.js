const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = __dirname;
const ANDROID_DIR = path.join(PROJECT_DIR, 'android');
const BUILD_OUTPUTS_DIR = path.join(ANDROID_DIR, 'app/build/outputs/bundle/release');
const AAB_PATH = path.join(BUILD_OUTPUTS_DIR, 'app-release.aab');
const EXTRACTED_DIR = path.join(BUILD_OUTPUTS_DIR, 'extracted');
const REPORT_PATH = path.join(PROJECT_DIR, 'alignment_report.md');

const READELF_PATH = 'C:\\Users\\digit\\AppData\\Local\\Android\\Sdk\\ndk\\27.1.12297006\\toolchains\\llvm\\prebuilt\\windows-x86_64\\bin\\llvm-readelf.exe';

function log(msg) {
    console.log(`[VERIFY] ${msg}`);
}

function runCmd(cmd, cwd) {
    log(`Running command: ${cmd}`);
    execSync(cmd, { cwd, stdio: 'inherit' });
}

function findSoFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findSoFiles(filePath, fileList);
        } else if (file.endsWith('.so')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function getLibraryAlignment(soFilePath) {
    try {
        const output = execSync(`"${READELF_PATH}" -l "${soFilePath}"`, { encoding: 'utf8' });
        const lines = output.split('\n');
        let loadSegments = [];
        let isCompliant = true;
        let alignments = [];

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('LOAD')) {
                const tokens = line.split(/\s+/);
                const alignToken = tokens[tokens.length - 1];
                if (alignToken && alignToken.startsWith('0x')) {
                    const alignmentVal = parseInt(alignToken, 16);
                    alignments.push(alignToken);
                    if (alignmentVal < 16384) { // 0x4000
                        isCompliant = false;
                    }
                }
            }
        }

        return {
            alignments: alignments.join(', '),
            pass: isCompliant && alignments.length > 0
        };
    } catch (err) {
        log(`Error reading elf headers for ${soFilePath}: ${err.message}`);
        return {
            alignments: 'ERROR',
            pass: false
        };
    }
}

function main() {
    const args = process.argv.slice(2);
    const skipBuild = args.includes('--skip-build');

    if (!skipBuild) {
        // Step 1: Clean build
        log('Cleaning previous build outputs...');
        try {
            runCmd('cmd.exe /c ".\\gradlew clean"', ANDROID_DIR);
        } catch (e) {
            log('Clean failed, proceeding anyway...');
        }

        // Step 2: Build bundle
        log('Building Release AAB...');
        runCmd('cmd.exe /c ".\\gradlew bundleRelease"', ANDROID_DIR);
    } else {
        log('Skipping Gradle build as requested.');
    }

    if (!fs.existsSync(AAB_PATH)) {
        log(`Error: AAB file not found at ${AAB_PATH}`);
        process.exit(1);
    }

    // Step 3: Extract AAB
    log(`Extracting AAB from ${AAB_PATH} to ${EXTRACTED_DIR}...`);
    if (fs.existsSync(EXTRACTED_DIR)) {
        fs.rmSync(EXTRACTED_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(EXTRACTED_DIR, { recursive: true });
    
    runCmd(`tar -xf "${AAB_PATH}" -C "${EXTRACTED_DIR}"`, PROJECT_DIR);

    // Step 4: Scan and Verify .so files
    log('Scanning for .so files...');
    const soFiles = findSoFiles(EXTRACTED_DIR);
    log(`Found ${soFiles.length} native libraries.`);

    let reportLines = [];
    reportLines.push('# Native Library 16 KB Page Alignment Report');
    reportLines.push('');
    reportLines.push(`**Generated at:** ${new Date().toISOString()}`);
    reportLines.push('');
    reportLines.push('| Library | Alignment(s) | Status |');
    reportLines.push('| :--- | :--- | :--- |');

    let allPassed = true;
    let failingCount = 0;

    for (const soFile of soFiles) {
        const relativePath = path.relative(EXTRACTED_DIR, soFile).replace(/\\/g, '/');
        const { alignments, pass } = getLibraryAlignment(soFile);
        const status = pass ? '🟢 PASS' : '🔴 FAIL';
        
        if (!pass) {
            allPassed = false;
            failingCount++;
        }

        reportLines.push(`| ${relativePath} | \`${alignments}\` | ${status} |`);
        log(`${relativePath}: Alignments = [${alignments}] -> ${status}`);
    }

    const reportContent = reportLines.join('\n');
    fs.writeFileSync(REPORT_PATH, reportContent, 'utf8');
    log(`Report saved to ${REPORT_PATH}`);

    if (allPassed) {
        log('🎉 SUCCESS: All native libraries are 16 KB aligned!');
        process.exit(0);
    } else {
        log(`❌ FAILURE: ${failingCount} libraries are not 16 KB aligned.`);
        process.exit(1);
    }
}

main();
