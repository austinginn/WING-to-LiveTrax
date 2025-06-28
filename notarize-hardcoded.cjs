// ./notarize-hardcoded.cjs
const { notarize } = require('@electron/notarize');
const config = require('./notarize-config.json');

module.exports = async function(context) {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;
  
  await notarize({
    appBundleId: 'com.aginn.winglivetrax',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: config.appleId,
    appleIdPassword: config.appleIdPassword,
    teamId: config.teamId
  });
};