// checkPullStatus.js
const simpleGit = require('simple-git');
const git = simpleGit();

async function checkForUpdates() {
  try {
    // 1️ Fetch latest commits from both origin and upstream
    await git.fetch('origin');
    await git.fetch('upstream');

    // 2️ Get current branch status
    const status = await git.status();

    // 3️ Check for uncommitted changes
    if (status.files.length > 0) {
      console.log('You have uncommitted changes. Please commit or stash them before pulling.');
    }

    // 4️ Check if behind origin
    if (status.behind > 0) {
      console.log(`Your branch is behind origin by ${status.behind} commit(s). Please pull the latest changes.`);
    }

    // 5️ Check commits behind upstream/main
    const upstreamDiff = await git.log([`${status.current}..upstream/main`]);
    if (upstreamDiff.total > 0) {
      console.log(`There are ${upstreamDiff.total} new commit(s) from upstream not yet in your branch.`);
    }

    // 6️ Check if ahead of origin
    if (status.ahead > 0) {
      console.log(`You have ${status.ahead} commit(s) ahead of origin. Consider pushing your changes.`);
    }

    // 7️ If everything is fine
    if (status.files.length === 0 && status.behind === 0 && upstreamDiff.total === 0 && status.ahead === 0) {
      console.log('Your branch is up-to-date with origin and upstream, and you have no uncommitted changes.');
    }

  } catch (err) {
    console.error('Error checking pull status:', err);
  }
}

checkForUpdates();
