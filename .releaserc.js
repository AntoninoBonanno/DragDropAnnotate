/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
    branches: ["master"],
    preset: "angular",
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/changelog",
        [
            // This will increase the version in the project without publishing it
            "@semantic-release/npm",
            {
                "npmPublish": false
            }
        ],
        [
            // Replace __VERSION__ from "src/dragDropAnnotate.min.js" file with correct version
            "semantic-release-replace-plugin",
            {
                "replacements": [
                    {
                        "files": ["src/dragDropAnnotate.min.js"],
                        "from": "__VERSION__",
                        "to": "v${nextRelease.version}",
                        "results": [
                            {
                                "file": "src/dragDropAnnotate.min.js",
                                "hasChanged": true,
                                "numMatches": 1,
                                "numReplacements": 1
                            }
                        ],
                        "countMatches": true
                    }
                ]
            }
        ],
        [
            // Creating the zip file
            "@semantic-release/exec",
            {
                "prepareCmd": "./build/create-zip.sh"
            }
        ],
        [
            // Creating the release and tag on GitHub
            "@semantic-release/github",
            {
                "assets": [
                    {
                        "path": "build/build.zip",
                        "name": "DragDropAnnotate-v${nextRelease.version}.zip",
                        "label": "DragDropAnnotate - v${nextRelease.version}"
                    },
                ]
            }
        ],
        [
            // Commit with the new updated files
            "@semantic-release/git",
            {
                "assets": [
                    "CHANGELOG.md",
                    "package.json",
                    "package-lock.json",
                    "src/dragDropAnnotate.min.js",
                    "src/dragDropAnnotate.min.css"
                ],
                "message": "chore(release): ${nextRelease.version} :tada: [skip ci]\n\n${nextRelease.notes}"
            }
        ]
    ]
}
