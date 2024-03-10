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
            // Creating the release and tag on GitHub
            "@semantic-release/github",
            {
                "assets": [
                    {
                        "path": [
                            "example/**",
                            "src/dragDropAnnotate.min.js",
                            "src/dragDropAnnotate.min.css",
                            "LICENSE",
                            "README.md"
                        ],
                        "name": "DragDropAnnotate-v${nextRelease.version}",
                        "label": "DragDropAnnotate - v${nextRelease.version}"
                    },
                ]
            }
        ],
        [
            // This will increase the version in the project without publishing it
            "@semantic-release/npm",
            {
                "npmPublish": false
            }
        ],
        [
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
            // Commit with the new updated files
            "@semantic-release/git",
            {
                "assets": [
                    "CHANGELOG.md",
                    "package.json",
                    "package-lock.json",
                    "dragDropAnnotate.min.js",
                    "dragDropAnnotate.min.css"
                ],
                "message": "chore(release): ${nextRelease.version} :tada: [skip ci]\n\n${nextRelease.notes}"
            }
        ]
    ]
}
