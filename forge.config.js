const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    asar: true,
    name: "Lynxky",
    productName: "Lynxky",
    executableName: "lynxky",
    icon: "app/favicon", // Usando favicon sem extensão
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        authors: "Derek W",
        description: "Lynxky - Your notes, your way.",
        name: "Lynxky",
        setupExe: "Lynxky-Setup.exe",
        setupMsi: "Lynxky-Setup.msi",
        setupIcon: 'app/favicon', // Use favicon sem extensão
        // iconUrl removido - deve ser uma URL HTTP válida ou omitido
      },
      platforms: ["win32"],
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "linux", "win32"],
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "Lynxky",
        icon: "app/favicon", // Usando favicon sem extensão
      },
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          maintainer: "Derek W",
          homepage: "https://lynxky.com",
          description: "Lynxky - Your notes, your way.",
          icon: "app/favicon", // Usando favicon sem extensão
        },
      },
      platforms: ["linux"],
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          maintainer: "Derek W",
          homepage: "https://lynxky.com",
          description: "Lynxky - Your notes, your way.",
          icon: "app/favicon", // Usando favicon sem extensão
        },
      },
      platforms: ["linux"],
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
