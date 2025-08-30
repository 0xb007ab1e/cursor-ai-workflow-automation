#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Professional JavaScript minifier using Terser
 * Safely minifies JavaScript while preserving functionality
 */
async function minifyJS(code) {
    try {
        // Try to use Terser if available
        const { minify } = require('terser');
        
        const result = await minify(code, {
            compress: {
                drop_console: false,        // Keep console.log statements
                drop_debugger: false,       // Keep debugger statements
                pure_funcs: [],            // Don't remove any function calls
                keep_fargs: true,          // Keep function arguments
                keep_fnames: true,         // Keep function names for debugging
                sequences: true,           // Join consecutive statements
                dead_code: true,           // Remove unreachable code
                conditionals: true,        // Optimize if-s and conditional expressions
                comparisons: true,         // Optimize comparisons
                evaluate: true,            // Evaluate constant expressions
                booleans: true,            // Optimize boolean expressions
                loops: true,               // Optimize loops
                unused: false,             // Don't remove unused variables (safer)
                hoist_funs: false,         // Don't hoist function declarations
                hoist_vars: false,         // Don't hoist variable declarations
                if_return: true,           // Optimize if/return and if/continue
                join_vars: true,           // Join consecutive var statements
                side_effects: false        // Don't remove side-effect-free statements
            },
            mangle: {
                keep_fnames: true,         // Keep function names
                keep_classnames: true,     // Keep class names
                reserved: [                // Don't mangle these names
                    'globalThis',
                    'simpleAccept',
                    'autoAcceptAndAnalytics',
                    'startAccept',
                    'stopAccept',
                    'acceptStatus',
                    'debugAccept',
                    'enableOnly',
                    'enableAll',
                    'disableAll',
                    'toggleButton',
                    'enableButton',
                    'disableButton',
                    'showAnalytics',
                    'exportAnalytics',
                    'clearAnalytics',
                    'validateData',
                    'clearStorage',
                    'enableDebug',
                    'disableDebug',
                    'toggleDebug',
                    'findDiffs',
                    'getContext',
                    'logActivity',
                    'recentDiffs',
                    'calibrateWorkflow'
                ]
            },
            format: {
                comments: /^!/,            // Keep comments starting with !
                beautify: false,           // Don't beautify output
                semicolons: true          // Always use semicolons
            },
            sourceMap: false,             // Don't generate source maps
            toplevel: false,              // Don't mangle top-level names
            keep_fnames: true,            // Keep function names
            keep_classnames: true         // Keep class names
        });
        
        if (result.error) {
            throw new Error(`Terser error: ${result.error}`);
        }
        
        return result.code;
        
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.log('⚠️  Terser not found. Installing...');
            
            // Try to install Terser
            const { execSync } = require('child_process');
            try {
                execSync('npm install terser', { stdio: 'inherit' });
                console.log('✅ Terser installed successfully');
                
                // Retry minification
                const { minify } = require('terser');
                const result = await minify(code, {
                    compress: {
                        drop_console: false,
                        drop_debugger: false,
                        pure_funcs: [],
                        keep_fargs: true,
                        keep_fnames: true
                    },
                    mangle: {
                        keep_fnames: true,
                        keep_classnames: true,
                        reserved: ['globalThis', 'simpleAccept', 'autoAcceptAndAnalytics']
                    }
                });
                
                return result.code;
                
            } catch (installError) {
                console.log('❌ Failed to install Terser. Using fallback minification...');
                return fallbackMinify(code);
            }
        } else {
            console.log(`⚠️  Terser error: ${error.message}. Using fallback...`);
            return fallbackMinify(code);
        }
    }
}

/**
 * Fallback minification (safer than the previous regex approach)
 */
function fallbackMinify(code) {
    return code
        // Remove single-line comments (but preserve URLs and important comments)
        .replace(/\/\/(?![^\r\n]*['"`])(?![^\r\n]*https?:).*$/gm, '')
        // Remove multi-line comments (but preserve license comments)
        .replace(/\/\*(?![\s\S]*@license)[\s\S]*?\*\//g, '')
        // Remove extra whitespace but preserve necessary spaces
        .replace(/\s+/g, ' ')
        // Remove spaces around specific operators (safer list)
        .replace(/\s*([{}();,])\s*/g, '$1')
        // Clean up
        .trim();
}

/**
 * Build the minified version
 */
async function build() {
    const inputFile = 'cursor-auto-accept-simple.js';
    const outputFile = 'cursor-auto-accept-simple.min.js';
    
    console.log('🔨 Building minified version with Terser...');
    
    try {
        // Check if input file exists
        if (!fs.existsSync(inputFile)) {
            throw new Error(`Input file ${inputFile} not found`);
        }
        
        // Read the source file
        const sourceCode = fs.readFileSync(inputFile, 'utf8');
        console.log(`📖 Read ${inputFile} (${sourceCode.length} characters)`);
        
        // Minify the code
        const minifiedCode = await minifyJS(sourceCode);
        console.log(`⚡ Minified code (${minifiedCode.length} characters)`);
        
        // Calculate compression ratio
        const compressionRatio = ((sourceCode.length - minifiedCode.length) / sourceCode.length * 100).toFixed(1);
        console.log(`📊 Compression: ${compressionRatio}% smaller`);
        
        // Add header comment to minified file
        const header = `/*! Cursor Auto-Accept Script (Minified) - Created by @ivalsaraj | Original: ${sourceCode.length} chars, Minified: ${minifiedCode.length} chars (${compressionRatio}% reduction) | Build: ${new Date().toISOString()} */\n`;
        
        const finalCode = header + minifiedCode;
        
        // Write the minified file
        fs.writeFileSync(outputFile, finalCode, 'utf8');
        console.log(`✅ Created ${outputFile}`);
        
        // Show file sizes
        const originalSize = (sourceCode.length / 1024).toFixed(1);
        const minifiedSize = (finalCode.length / 1024).toFixed(1);
        console.log(`📏 Original: ${originalSize}KB → Minified: ${minifiedSize}KB`);
        
        // Validate the minified code
        try {
            new Function(minifiedCode);
            console.log('✅ Minified code syntax validation passed');
        } catch (syntaxError) {
            console.warn('⚠️  Syntax validation warning:', syntaxError.message);
        }
        
        return {
            success: true,
            originalSize: sourceCode.length,
            minifiedSize: minifiedCode.length,
            compressionRatio: parseFloat(compressionRatio)
        };
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run build if called directly
if (require.main === module) {
    build().then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { build, minifyJS }; 