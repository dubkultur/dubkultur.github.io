import { initRepo } from './git.js';
import { attachClick, byId, enable, sanitize } from './doc_utils.js';
import { progress } from './progress.js';

const THE_ONE_AND_ONLY_LOCALDIR = '/idk';

function repoInfoToLocalStorage(repoInfo) {
  window.localStorage.setItem('repoUrl', repoInfo.url);
  window.localStorage.setItem('repoMail', repoInfo.email);
  window.localStorage.setItem('repoUser', repoInfo.user);
}

function repoInfoFromLocalStorage() {
  const repo = window.localStorage.getItem('repoUrl'),
      email = window.localStorage.getItem('repoMail'),
      user = window.localStorage.getItem('repoUser');

  if (!repo || !email || !user) {
      return false;
  }

  return {
    user, 
    email, 
    repo
  };
}

async function isAlreadyCloned(http, pfs, fs) {
  const repoInfo = repoInfoFromLocalStorage();
  if (repoInfo) {
    const progressDialog = initProgressDialog();
    const repo = await initRepo(http, pfs, fs, THE_ONE_AND_ONLY_LOCALDIR, repoInfo, progressDialog);
    return repo;
  }
  return false;
}

function initProgressDialog() {
  const progressDialog = progress('initdialog_progress');
  enable('initdialog_ok', false);
  progressDialog.showProgress(true);
  return progressDialog;
}

export function showInitRepoDialog(http, pfs, fs) {
  return new Promise(async (resolve) => {
    const dialog = byId('initdialog');
    dialog.showModal();

    const existingRepoInfo = repoInfoFromLocalStorage();
    if (existingRepoInfo) {
      byId('initdialog_user').value = existingRepoInfo.user;
      byId('initdialog_email').value = existingRepoInfo.email;
      byId('initdialog_repo').value = existingRepoInfo.repo;

      const existingRepo = await isAlreadyCloned(http, pfs, fs);
      if (existingRepo) {
        dialog.close();
        resolve(existingRepo);
      }
    }
    
    setTimeout(() => {
        const e = byId('initdialog_user');
        e.select();
        e.focus();
    }, 1);
    
    attachClick('initdialog_ok', async () => {
    const user = byId('initdialog_user').value,
          email = byId('initdialog_email').value,
          repo = byId('initdialog_repo').value,
          token = byId('initdialog_token').value,
          storeToken = byId('initdialog_store_token').checked,
          repoInfo = {
            user, 
            email, 
            repo,
            token
          };

    if (storeToken) {
      window.localStorage.setItem('repoToken', token);
    } else {
      window.localStorage.removeItem('repoToken');
    }

    const progressDialog = initProgressDialog();
    const repoObj = await initRepo(http, pfs, fs, THE_ONE_AND_ONLY_LOCALDIR, repoInfo, progressDialog);
    repoInfoToLocalStorage(repoInfo);
    dialog.close();
    resolve(repoObj);
    });
  });
}

// Maybe !?? better !!? do it like .. https://github.com/mdn/web-components-examples/blob/main/editable-list/main.js
export function showSelectFileDialog(files) {
  return new Promise(async (resolve) => {
    const itemHtml = files.map(f => 
      `<li style='width: 100%;display: flex;justify-content: space-between;'>
        ${sanitize(f)}
      </li>`).join('');
      
      const items = byId('filesdialog_items');
      items.innerHTML = itemHtml;

      const dialog = byId('filesdialog');
      dialog.showModal();

      byId('filesdialog').addEventListener('click', evt => {
        let file;
        if (evt.target && evt.target.parentElement && evt.target.parentElement.id 
            && evt.target.parentElement.id === 'filesdialog_items') {
          file = evt.target.innerText;
          //alert("You picked: " + file);
        }
        dialog.close();
        resolve(file);
      }, { capture: true, once: true });
  });
}