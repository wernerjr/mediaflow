module.exports = {
  packagerConfig: {
    icon: 'assets/icon.ico',
    asar: true,
    asarUnpack: [
      "**/node_modules/sharp/**/*"
    ],
    env: {
      NODE_ENV: 'production'
    },
    ignore: [
      "^\\/\\.",
      "node_modules/.cache"
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: 'assets/icon.ico',
        setupIcon: 'assets/icon.ico',
        loadingGif: 'assets/installing.gif',
        compression: 'maximum'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    }
  ],
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      const fs = require('fs');
      const path = require('path');
      const { execSync } = require('child_process');
      
      // Remove any existing sharp installation
      const sharpPath = path.join(buildPath, 'node_modules', 'sharp');
      if (fs.existsSync(sharpPath)) {
        fs.rmSync(sharpPath, { recursive: true, force: true });
      }

      // Install sharp
      console.log('Installing sharp...');
      execSync('npm install sharp@latest', {
        cwd: buildPath,
        stdio: 'inherit'
      });

      // Use electron-rebuild to rebuild sharp
      console.log('Rebuilding sharp with electron-rebuild...');
      execSync('npx @electron/rebuild --only=sharp', {
        cwd: buildPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          npm_config_target: electronVersion,
          npm_config_arch: arch,
          npm_config_target_arch: arch,
          npm_config_runtime: 'electron',
          npm_config_build_from_source: true,
          npm_config_devdir: path.join(buildPath, '.electron-gyp')
        }
      });
    }
  }
}; 