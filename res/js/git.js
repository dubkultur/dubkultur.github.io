import { attachClick, byId, enable } from "./doc_utils.js";
import { progress } from './progress.js';

export async function initRepo(http, pfs, fs, localDir, repoInfo, progressHandler) {
    if (!await isCloned(pfs, localDir, repoInfo)) {
        await cloneRepo(http, pfs, fs, localDir, repoInfo, progressHandler);
    }

    return ((pfs, localDir) => {
        return {
            listFiles: async () => {
                const readDir = await pfs.readdir(`${localDir}/pages/`);
                return ['/index.html', ...readDir.map(e => `/pages/${e}`)];
            },
            readFile: async path => {
                const raw = await pfs.readFile(`${localDir}${path}`),
                    content = new TextDecoder().decode(raw);
                return content;
            },
            writeFile: async (path, content) => {
                await pfs.writeFile(`${localDir}${path}`, content);
            },
            revertFile: async (file) => {
                await git.checkout({fs, dir: localDir, force: true, filepaths: [file.substr(1)]});
            },
            revertAll: async () => {
                await git.checkout({fs, dir: localDir, force: true});
            },
            commitModifications: () => {
                return new Promise(async (resolve, reject) => {
                    const readDir = await pfs.readdir(`${localDir}/pages/`);
                    const files = ['/index.html', ...readDir.map(e => `/pages/${e}`)];
                    const res = files.map(async f => {return {path: f, status: await git.status({ fs, dir: localDir, filepath: f.substr(1) })}});
                    const status = await Promise.all(res);
                    const modifiedFiles = status.filter(f => f.status.startsWith('*')).map(f => f.path);
                    
                    let commitMessage = `Modified: ${modifiedFiles.join(' ,')}.`;

                    const dialog = byId('commitdialog');
                    dialog.showModal();
                    byId('commitdialog_message').value = commitMessage;

                    const progressDialog = progress('commitdialog_progress');
                    progressDialog.showProgress(true);
                    progressDialog.setProgress(10);

                    attachClick('commitdialog_ok', async () => {
                        enable('initdialog_ok', false);
                        progressDialog.setProgress(30);
                        commitMessage = byId('commitdialog_message').value;
                        for (const mf of modifiedFiles) {
                            await git.add({fs, dir: localDir, filepath: mf.substr(1)});
                        }
                        progressDialog.setProgress(40);
                        const sha = await git.commit({
                            fs,
                            dir: localDir,
                            message: commitMessage,
                            author: {
                                name: repoInfo.user,
                                email: repoInfo.email,
                            }
                        });
                        progressDialog.setProgress(50);
                        /*
                        try {
                            const pushResult = await git.push({
                                fs,
                                http,
                                dir: localDir,
                                remote: 'origin',
                                ref: 'main',
                                //onAuth: () => ({ username: getToken(repoInfo) }),
                                onAuth: getOnAuth(repoInfo)
                            });
                            console.log(pushResult);
                            if (!pushResult.ok) {
                                alert('Sorry -.- That did not work..');
                            }
                        } catch (e) {
                            alert('Sorry -.- Is your token OK?');
                        }
                        */
                       progressDialog.setProgress(100);
                       dialog.close();
                       resolve();
                    });

                    attachClick('commitdialog_cancel', async () => {
                        dialog.close();
                        reject();
                    });
                });
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
        onAuth: getOnAuth(repoInfo)
    });

    progressHandler.setProgress(90);
}

function getOnAuth(repoInfo) {
    return url => {
        //const pw = repoInfo.token ? repoInfo.token : prompt('Password or Token, please.');
        const pw = getToken(repoInfo);
        return {
            username: pw,
            //password: pw,
        };
    };
}

function getToken(repoInfo) {
    if (repoInfo.token) {
        return repoInfo.token;
    }
    const storedValue = window.localStorage.getItem('repoToken');
    if (storedValue) {
        return storedValue;
    }
    return prompt('Password or Token, please.');
}