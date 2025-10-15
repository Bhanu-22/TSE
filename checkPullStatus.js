// checkPullStatus.js
const simpleGit = require('simple-git');
const git = simpleGit();

async function checkForUpdates() {
  try {
    // Fetch remote changes
    await git.fetch();

    // Get status
    const status = await git.status();

    if (status.behind > 0) {
      console.log(
        `Your branch is behind by ${status.behind} commit(s). Please pull the latest changes.`
      );
    } else if (status.ahead > 0) {
      console.log(
        `You have ${status.ahead} commit(s) ahead of the remote. Consider pushing your changes.`
      );
    } else {
      console.log('Your branch is up-to-date with the remote.');
    }
  } catch (err) {
    console.error('Error checking pull status:', err);
  }
}

checkForUpdates();
