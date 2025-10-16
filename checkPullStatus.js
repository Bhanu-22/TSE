// checkPullStatus.js
const simpleGit = require('simple-git');
const git = simpleGit();
 
async function checkForUpdates() {
  try {
    // 1️ Get the current branch dynamically
    const currentBranchSummary = await git.branch();
    const currentBranch = currentBranchSummary.current;
 
    // 2️ Fetch latest commits from both origin and upstream
    await git.fetch('origin');
    await git.fetch('upstream');
 
    // 3️ Get status for current branch
    const status = await git.status();
 
    // 4️ Check for uncommitted changes
    if (status.files.length > 0) {
      console.log('You have uncommitted changes. Please commit or stash them before pulling.');
    }
 
    // 5️ Check if behind origin
    if (status.behind > 0) {
      console.log(`Your branch '${currentBranch}' is behind origin by ${status.behind} commit(s). Please pull the latest changes.`);
    }
 
    // 6️ Check commits behind upstream
    const upstreamDiff = await git.log([`${currentBranch}..upstream/${currentBranch}`]);
    if (upstreamDiff.total > 0) {
      console.log(`There are ${upstreamDiff.total} new commit(s) from upstream not yet in your branch '${currentBranch}'.`);
    }
 
    // 7️ Check if ahead of origin
    if (status.ahead > 0) {
      console.log(`You have ${status.ahead} commit(s) ahead of origin on branch '${currentBranch}'. Consider pushing your changes.`);
    }
 
    // 8️ If everything is fine
    if (status.files.length === 0 && status.behind === 0 && upstreamDiff.total === 0 && status.ahead === 0) {
      console.log(`Your branch '${currentBranch}' is up-to-date with origin and upstream, and you have no uncommitted changes.`);
    }
 
  } catch (err) {
    console.error('Error checking pull status:', err);
  }
}
 
checkForUpdates();