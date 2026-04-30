# Update a `.deb` package in a GitHub Pages APT repository

To publish a new version of a Debian package in an APT repository managed with `reprepro`, the normal workflow is to build a new `.deb` with a higher version, include it in the repository again, and push the updated repository metadata to GitHub Pages.[1][2] Reusing the same package version for changed contents is not the correct update path, because repository tools treat the same package name and version as the same release.[1][3]

## Prerequisites

Make sure the following are already available before updating the package:[2]

- A working APT repository folder, for example `~/worklog-apt`[2]
- A configured `conf/distributions` file in that repository[ cite:118]
- The signing key already set up for `reprepro`[2]
- A new `.deb` file with a higher version, for example `worklog_0.5.1_amd64.deb`[3]

## Step 1: Build a new `.deb`

Create a new Debian package with a higher version number than the one currently published.[3] For example, if the current package is `0.5.0`, the next one should be `0.5.1` or `0.6.0`.[3]

Example expected output file:

```bash
worklog_0.5.1_amd64.deb
```

## Step 2: Go to the APT repository folder

Enter the repository directory where `conf/`, `dists/`, and `pool/` are managed.[2]

```bash
cd ~/worklog-apt
```

## Step 3: Add the new package to the repo

Include the new `.deb` in the repository using `reprepro`.[2][1] If the package does not contain `Section` and `Priority` metadata, pass them explicitly with `-S` and `-P`.[4][5]

```bash
reprepro -b . -C main -S utils -P optional includedeb any /path/to/worklog_0.5.1_amd64.deb
```

This command updates the repository metadata and publishes the new package version into the repository structure.[2][1]

## Step 4: Verify the package is in the repo

List the packages known to the repository to confirm that the new version was added successfully.[1]

```bash
reprepro -b . list any
```

It is also useful to inspect the generated files:

```bash
find dists pool | head -n 50
```

The repository should contain updated metadata under `dists/` and package files under `pool/`.[2][6]

## Step 5: Commit the updated repository files

Because the repository is hosted on GitHub Pages, the generated metadata and package file references must be committed and pushed to GitHub.[7][8]

```bash
git add .
git commit -m "Publish worklog 0.5.1"
git push
```

After the push, GitHub Pages serves the updated repository content.[7]

## Step 6: Test the update in Ubuntu

On a clean Ubuntu environment, refresh APT metadata and upgrade the package.[9][10]

```bash
sudo apt update
sudo apt upgrade
```

To install or test just this package directly:

```bash
sudo apt install worklog
```

APT normally installs the newest available version from the configured repository after `apt update` refreshes the metadata.[9]

## Full update example

This is the typical full update flow for version `0.5.1`:[2][1]

```bash
cd ~/worklog-apt
reprepro -b . -C main -S utils -P optional includedeb any /path/to/worklog_0.5.1_amd64.deb
reprepro -b . list any
git add .
git commit -m "Publish worklog 0.5.1"
git push
```

## Important notes

- Always bump the package version before publishing an updated `.deb`.[3]
- Do not replace a published package with different contents but the same version string.[1][11]
- If users already added the repository, they only need `sudo apt update && sudo apt upgrade` to receive the new version.[9]
- If the package metadata lacks `Section`, use `-S utils`; if it lacks `Priority`, use `-P optional`.[4][12]