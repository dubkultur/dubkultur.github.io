export async function initRepo(http, pfs, fs, localDir, repoInfo, progressHandler) {
    if (!await isCloned(pfs, localDir, repoInfo)) {
        await cloneRepo(http, pfs, fs, localDir, repoInfo, progressHandler);
    }

    return ((pfs, localDir) => {
        return {
            listFiles: async () => {
                //todo IMPL
                //let readDir = await pfs.readdir(`${localDir}/pages/`);
                //return ['index.html', ...readDir];
                return [
        'index.html', 'file1.html', 'file2.html', 'file3.html', 'file4.html',
        'index.html', 'file1.html', 'file2.html', 'file3.html', 'file4.html'
        ];
            },
            readFile: async path => {
                // todo properly read file or show template selection dialog to create a new file
                //const srcJson = await pfs.readFile(`${localDir}/pages/${srcJsonPath}`);
                return `<p>Hello World!</p>
    <p>Some initial <strong>bold</strong> text</p>
    <p><br /></p>`;
            },
            writeFile: async (path, content) => {
                // todo new pages must be created in /pages/; index is the only editable file in root
                //await pfs.writeFile(`${localDir}/pages/${path}`, content);
                throw 'IMPL';
            }
        };
    })(pfs, localDir);
}

async function isCloned(pfs, localDir, repoInfo) {

    let readDir = [];
    try {
        readDir = await pfs.readdir(localDir);
    } catch (e) {
        return false;
    }

    if (readDir.length === 0) {
        return false;
    }

    readDir = await pfs.readdir(localDir);

    return readDir.length > 1;

    // should also check output of 
// -- `git remote -v` to check if it really is the correct repo
// -- `git status ` to check the status 
}

export async function cloneRepo(http, pfs, fs, localDir, repoInfo, progressHandler) {
    let readDir = [];
    try {
        readDir = await pfs.readdir(localDir);
    } catch (e) {
    }

    if (readDir.length === 0) {
        try {
            await pfs.mkdir(localDir);
        } catch(e) {
        }
    }

    readDir = await pfs.readdir(localDir);

    if (readDir.length > 1) {
        await git.pull({
            fs,
            http,
            dir: localDir,
            ref: 'main',
            singleBranch: true,
            author: {
                name: repoInfo.user,
            }
        });

        //if failed -> clean vfs and start over
        //... but it just *always* !? seems to just work -.-

        progressHandler.setProgress(90);

        //setProgress(90);
        return;
    }

    progressHandler.setProgress(10);
    // todo is there a callback to show progress while cloning?
    let cloneRes = await git.clone({
        fs,
        http,
        dir: localDir,
        corsProxy: 'https://cors.isomorphic-git.org',
        url: repoInfo.repo,//'https://github.com/isomorphic-git/isomorphic-git',
        ref: 'main',
        singleBranch: true,
        depth: 1,
        onAuth: url => {
            const //username = user
                    pw = repoInfo.token ? repoInfo.token : prompt('Password or Token, please.');
            return {
                username: pw,
                //password: pw,
            };
        }
    });

    progressHandler.setProgress(90);
}
