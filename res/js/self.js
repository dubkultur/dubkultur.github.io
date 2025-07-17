import { initRepo } from './git.js';
import { attachClick, byId, enable, sanitize, show } from './doc_utils.js';
import { progress } from './progress.js';

const THE_ONE_AND_ONLY_LOCALDIR = '/idk';

function repoInfoToLocalStorage(storeToken, repoInfo) {
  if (storeToken) {
    window.localStorage.setItem('repoToken', repoInfo.token);
  } else {
    window.localStorage.removeItem('repoToken');
  }
  window.localStorage.setItem('repoUrl', repoInfo.repo);
  window.localStorage.setItem('repoMail', repoInfo.email);
  window.localStorage.setItem('repoUser', repoInfo.user);
}

function repoInfoFromLocalStorage() {
  const repo = window.localStorage.getItem('repoUrl'),
      email = window.localStorage.getItem('repoMail'),
      user = window.localStorage.getItem('repoUser'),
      token = window.localStorage.getItem('repoToken');

  if (!repo || !email || !user) {
      return false;
  }

  const ri = {
    user, 
    email, 
    repo
  };

  if (token) {
    ri.token = token;
  }

  return ri;
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
    enable('initdialog_ok', false);

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

    enable('initdialog_ok', true);
    
    setTimeout(() => {
        /*
          edit.html and preview.html can show this dialog only for a very short time 
          (if the repo is already cloned). It might happen that the dialog was already
          removed before this code runs, then the `initdialog_user` element cannot be found.
          .. which is ok.
          
          todo change the dialog so that it is not shown at all if no cloning is needed 
        */
        const e = byId('initdialog_user', { ignoreNotFound: true });
        if (e) {
          e.select();
          e.focus();
        }
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
      repoInfoToLocalStorage(storeToken, repoInfo);

      const progressDialog = initProgressDialog();
      const repoObj = await initRepo(http, pfs, fs, THE_ONE_AND_ONLY_LOCALDIR, repoInfo, progressDialog);
      dialog.close();
      resolve(repoObj);
    });
  });
}

export function showSelectFileDialog(files, ops) {
  if (!ops) {
    ops = {allowCancel: false, allowNew: false};
  }

  return new Promise(async (resolve, reject) => {
    byId('filesdialog_items').innerHTML = files.map(f => 
      `<li style='width: 100%;display: flex;justify-content: space-between;'>${sanitize(f)}</li>`).join('');

    const dialog = byId('filesdialog');
    dialog.showModal();

    if (ops.allowCancel) {
      show('filesdialog_cancel_container', true);
      attachClick('filesdialog_cancel', () => {
        dialog.close();
        reject('canceled');
      })
    }
    if (ops.allowNew) {
      show('filesdialog_new_container', true);
      attachClick('filesdialog_new', () => {
        const newVal = byId('filesdialog_new_value').value;
        if (newVal.length > 0 && !files.includes(newVal)) {
          dialog.close();
          resolve({value: newVal, isNew: true});
        }
      })
    }

    Array.from(document.querySelectorAll('#filesdialog li')).forEach(el => 
      el.addEventListener('click', evt => {
        dialog.close();
        resolve({value: evt.target.innerText, isNew: false});
      })
    );
  });
}