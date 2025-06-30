// notarize.cjs
require('dotenv').config();
const path = require('path');
const { notarize } = require('electron-notarize');
const { spawnSync } = require('child_process');

module.exports = async function notarizing(context) {
  const { electronPlatformName, packager, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  const appName = packager.appInfo.productFilename;            // “WING to LiveTrax”
  const appPath = path.join(appOutDir, `${appName}.app`);
  const zipPath = path.join(appOutDir, `${appName}.zip`);

  console.log('💽  Zipping .app for notarization…');
  // -c = create archive, -k = zip, --sequesterRsrc & --keepParent preserve resource forks & bundle dir
  spawnSync('ditto', [
    '-c', '-k', 
    '--sequesterRsrc', 
    '--keepParent', 
    appPath, 
    zipPath
  ], { stdio: 'inherit' });

  console.log('📤  Submitting to Apple notary service…');
  await notarize({
    tool:            'notarytool',
    appPath:         zipPath,
    appleId:         process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId:          process.env.APPLE_TEAM_ID,
    // ascProvider:   process.env.APPLE_PROVIDER,  // only if you need it
  });

  console.log('📌  Stapling ticket to the .app bundle…');
  spawnSync('xcrun', ['stapler', 'staple', appPath], { stdio: 'inherit' });

  console.log('✅  Notarization and stapling complete!');
};
