// notarize.cjs
require('dotenv').config();
const path = require('path');
const { notarize } = require('@electron/notarize');

module.exports = async function notarizing(context) {
  const { electronPlatformName, packager, appOutDir } = context;
  // only run on macOS
  if (electronPlatformName !== 'darwin') return;

  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`📤 Notarizing ${appPath}…`);
  await notarize({
    // point at the signed .app bundle
    appPath,
    appleId:           process.env.APPLE_ID,
    appleIdPassword:   process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId:            process.env.APPLE_TEAM_ID,
  });
  console.log('✅ Notarization complete!');
};