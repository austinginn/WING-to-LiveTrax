// ./notarize.js
const { notarize } = require('@electron/notarize');

module.exports = async (context) => {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;
  
  await notarize({
    appBundleId: 'com.aginn.winglivetrax',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: 'P76H6523Q4'
  });
};